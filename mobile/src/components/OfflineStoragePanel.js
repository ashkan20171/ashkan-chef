import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNetworkState} from 'expo-network';
import {classifyConnection, connectionMessage} from '../utils/offlineConnection.mjs';
import {canStartOfflineImageBatch, shouldContinueOfflineImageBatch} from '../utils/offlineBatchPolicy.mjs';
import {offlineReadinessSummary, offlineRecipeStatus} from '../utils/offlineReadiness.mjs';
import {inspectOfflineLibrary, favoriteRecipeSnapshots} from '../utils/offlineRecipeLibrary.mjs';
import {createOfflineRecipeStore} from '../utils/offlineRecipeStore.mjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, ActivityIndicator, Image, Text, TouchableOpacity, View} from 'react-native';
import {clearOfflineImages, getOfflineImageStats, listOfflineImages, deleteOfflineImage, getOfflineImageLimit, setOfflineImageLimit, saveOfflineImage, getOfflineImage} from '../services/persistentImageCache';
import {formatCacheBytes} from '../utils/offlineStorage.mjs';
import {favoriteImageUrls, bulkProgress} from '../utils/bulkOfflineImages.mjs';
import {cacheUsagePercent, MAX_CACHED_IMAGES, MAX_IMAGE_BYTES} from '../utils/imageCachePolicy.mjs';

export default function OfflineStoragePanel({language='fa', palette, recipes=[], favoriteIds=[], onOpenOfflineRecipe}) {
  const fa = language !== 'en';
  const networkState = useNetworkState();
  const connection = classifyConnection(networkState);
  const connectionInfo = connectionMessage(connection, language);
  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const [stats,setStats] = useState(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState(false);
  const [files,setFiles] = useState([]);
  const [limit,setLimit] = useState(MAX_CACHED_IMAGES);
  const [batch,setBatch] = useState(null);
  const [offlineLibrary,setOfflineLibrary] = useState([]);
  const [libraryNotice,setLibraryNotice] = useState(null);
  const [libraryBusy,setLibraryBusy] = useState(false);
  const libraryStore = useRef(createOfflineRecipeStore(AsyncStorage));
  const cancelRequested = useRef(false);
  const running = useRef(false);
  const favoriteUrls = favoriteImageUrls(recipes, favoriteIds);
  const readiness = offlineReadinessSummary(recipes,favoriteIds,offlineLibrary);
  const currentById = new Map(recipes.map(r=>[String(r.id),r]));
  const statusLabel = status => fa ? ({ready:"آماده آفلاین",outdated:"نسخه قدیمی", "not-saved":"ذخیره‌نشده",unavailable:"ناموجود"}[status]) : ({ready:"Ready offline",outdated:"Update available", "not-saved":"Not saved",unavailable:"Unavailable"}[status]);
  const downloadFavorites = async () => {
    if (!canStartOfflineImageBatch({isRunning:running.current,isBusy:busy,imageCount:favoriteUrls.length,connection})) return;
    running.current = true;
    cancelRequested.current = false;
    setBatch({done:0,total:favoriteUrls.length,saved:0,failed:0,cancelled:false});
    let saved=0,failed=0,done=0;
    try {
      // Sequential downloads bound network usage; cancellation stops before the next image.
      for (const url of favoriteUrls) {
        if (!shouldContinueOfflineImageBatch({cancelRequested:cancelRequested.current,connection:connectionRef.current})) break;
        try {
          const cached = await getOfflineImage(url);
          const result = cached || await saveOfflineImage(url);
          if (result) saved++; else failed++;
        } catch { failed++; }
        done++;
        setBatch({done,total:favoriteUrls.length,saved,failed,cancelled:false});
      }
      setBatch({done,total:favoriteUrls.length,saved,failed,cancelled:cancelRequested.current});
      await refresh();
    } finally { running.current=false; }
  };
  const refresh = useCallback(async () => {
    setBusy(true);setError(false);
    try {const [usage, images, maxImages] = await Promise.all([getOfflineImageStats(),listOfflineImages(),getOfflineImageLimit()]);setStats(usage);setFiles(images);setLimit(maxImages);} catch {setError(true);} finally {setBusy(false);}
  }, []);
  useEffect(() => {void refresh();}, [refresh]);
  useEffect(()=>{let mounted=true;libraryStore.current.load().then(report=>{if(!mounted)return;setOfflineLibrary(report.recipes);setLibraryNotice(report.status==='corrupt'||report.status==='invalid-shape'||report.status==='recovered'?report:null);}).catch(()=>{if(mounted)setError(true);});return()=>{mounted=false;};},[]);
  const saveFavoritesOffline = async () => {
    if(libraryStore.current.pending)return;
    setLibraryBusy(true);
    try {
      const result = await libraryStore.current.saveFavorites(recipes,favoriteIds);
      setOfflineLibrary(result.recipes);setLibraryNotice(null);
    } catch {Alert.alert(fa?'خطا':'Error',fa?'ذخیره دستورها ناموفق بود.':'Could not save offline recipes.');}
    finally{setLibraryBusy(false);}
  };
  const deleteOfflineRecipe = id => {
    if (libraryBusy || libraryStore.current.pending) return;
    Alert.alert(fa?'حذف دستور آفلاین':'Remove offline recipe',fa?'نسخه آفلاین این دستور حذف شود؟':'Remove this downloaded recipe?',[ 
      {text:fa?'انصراف':'Cancel',style:'cancel'},
      {text:fa?'حذف':'Remove',style:'destructive',onPress:async()=>{
        if(libraryStore.current.pending)return;
        setLibraryBusy(true);
        try {
          const result = await libraryStore.current.remove(id);
          setOfflineLibrary(result.recipes);setLibraryNotice(null);
        } catch {Alert.alert(fa?'خطا':'Error',fa?'حذف ناموفق بود.':'Could not remove recipe.');}
        finally{setLibraryBusy(false);}
      }}
    ]);
  };

  const clear = () => Alert.alert(fa?'پاک‌سازی تصاویر آفلاین':'Clear offline images',
    fa?'تصاویر ذخیره‌شده حذف شوند؟ دستورهای آشپزی و علاقه‌مندی‌ها حفظ می‌شوند.':'Remove downloaded images? Recipes and favorites will remain.', [
      {text:fa?'انصراف':'Cancel',style:'cancel'},
      {text:fa?'حذف تصاویر':'Delete images',style:'destructive',onPress:async()=>{
        setBusy(true);const ok=await clearOfflineImages();
        if (!ok) Alert.alert(fa?'خطا':'Error',fa?'پاک‌سازی انجام نشد.':'Could not clear offline images.');
        await refresh();
      }}]);
  const removeOne = name => Alert.alert(fa?'حذف تصویر':'Delete image', fa?'این تصویر آفلاین حذف شود؟':'Remove this offline image?', [
    {text:fa?'انصراف':'Cancel',style:'cancel'},
    {text:fa?'حذف':'Delete',style:'destructive',onPress:async()=>{
      setBusy(true);
      const ok = await deleteOfflineImage(name);
      if (!ok) Alert.alert(fa?'خطا':'Error',fa?'حذف تصویر انجام نشد.':'Could not delete image.');
      await refresh();
    }}
  ]);
  const capacity = cacheUsagePercent(stats?.bytes ?? 0, limit * MAX_IMAGE_BYTES);
  const row = {flexDirection:fa?'row-reverse':'row',alignItems:'center',justifyContent:'space-between',marginTop:12};
  const text = {color:palette.ink,textAlign:fa?'right':'left'};
  const button = {paddingVertical:12,paddingHorizontal:15,borderRadius:12,backgroundColor:palette.background,borderWidth:1,borderColor:palette.border,marginTop:14,alignItems:'center'};
  return <View style={{marginTop:22,borderTopWidth:1,borderColor:palette.border,paddingTop:12}}>
    <Text style={{...text,fontSize:18,fontWeight:'800'}}>{fa?'حافظه تصاویر آفلاین':'Offline image storage'}</Text>
    <View accessibilityLiveRegion="polite" style={{marginTop:10,padding:11,borderRadius:10,borderWidth:1,borderColor:connection==='online'?palette.primary:palette.border,backgroundColor:palette.background}}>
      <Text style={{...text,fontWeight:'800'}}>{connectionInfo.title}</Text>
      <Text style={{...text,color:palette.muted,marginTop:4}}>{connectionInfo.detail}</Text>
    </View>
    <Text style={{...text,color:palette.muted,marginTop:8}}>{fa?'فقط تصاویر دستورهای بازدیدشده ذخیره می‌شوند.':'Only viewed recipe images are stored.'}</Text>
    <View style={row}><Text style={text}>{fa?'تعداد تصاویر':'Saved images'}</Text><Text style={text}>{stats?.count ?? '—'}</Text></View>
    <View style={row}><Text style={text}>{fa?'حجم اشغال‌شده':'Storage used'}</Text><Text style={text}>{stats?formatCacheBytes(stats.bytes,language):'—'}</Text></View>
    <Text style={{...text,color:palette.muted,marginTop:12}}>{fa?'ظرفیت تقریبی فایل‌ها':'Approximate file capacity'}: {capacity}%</Text>
    <View accessibilityRole="progressbar" accessibilityValue={{min:0,max:100,now:capacity}} style={{height:8,borderRadius:8,backgroundColor:palette.border,overflow:'hidden',marginTop:6}}>
      <View style={{width:`${capacity}%`,height:8,backgroundColor:palette.primary}}/>
    </View>
    <View style={{marginTop:18,padding:12,borderRadius:12,borderWidth:1,borderColor:palette.border}}>
      <Text style={{...text,fontWeight:'800'}}>{fa?'دانلود تصاویر علاقه‌مندی‌ها':'Download saved recipe images'}</Text>
      <Text style={{...text,color:palette.muted,marginTop:6}}>{connection==='offline' ? (fa?'اینترنت قطع است؛ پس از اتصال دوباره دانلود را شروع کن.':'You are offline. Reconnect before starting downloads.') : (fa?`${favoriteUrls.length} تصویر قابل دانلود · دانلود به‌ترتیب انجام می‌شود.`:`${favoriteUrls.length} available images · downloaded sequentially.`)}</Text>
      {batch ? <>
        <Text accessibilityLiveRegion="polite" style={{...text,marginTop:10}}>{fa?`پیشرفت: ${batch.done} از ${batch.total} · موفق: ${batch.saved} · ناموفق: ${batch.failed}`:`Progress: ${batch.done}/${batch.total} · saved: ${batch.saved} · failed: ${batch.failed}`}</Text>
        <View accessibilityRole="progressbar" accessibilityValue={{min:0,max:100,now:bulkProgress(batch.done,batch.total)}} style={{height:7,backgroundColor:palette.border,borderRadius:8,overflow:'hidden',marginTop:8}}>
          <View style={{width:`${bulkProgress(batch.done,batch.total)}%`,height:7,backgroundColor:palette.primary}}/>
        </View>
        {batch.cancelled ? <Text style={{...text,color:palette.muted,marginTop:7}}>{fa?'دانلود متوقف شد؛ تصاویر تکمیل‌شده باقی می‌مانند.':'Stopped; completed downloads remain available.'}</Text> : null}
      </> : null}
      <TouchableOpacity accessibilityRole="button" disabled={!canStartOfflineImageBatch({isRunning:running.current,isBusy:busy,imageCount:favoriteUrls.length,connection})} onPress={downloadFavorites} style={[button,{opacity:busy||!favoriteUrls.length?0.5:1}]}>
        <Text style={text}>{connection==='offline' ? (fa?'پس از اتصال دوباره تلاش کن':'Reconnect to download') : (fa?'دانلود تصاویر ذخیره‌شده':'Download saved recipe images')}</Text>
      </TouchableOpacity>
      {batch && running.current ? <TouchableOpacity accessibilityRole="button" onPress={()=>{cancelRequested.current=true;}} style={button}>
        <Text style={{color:palette.primary}}>{fa?'توقف پس از تصویر جاری':'Stop after current image'}</Text>
      </TouchableOpacity> : null}
    </View>
    <View style={{marginTop:18,padding:12,borderRadius:12,borderWidth:1,borderColor:palette.border}}>
      <Text style={{...text,fontWeight:'800'}}>{fa?'کتابخانه دستورهای آفلاین':'Offline recipe library'}</Text>
      <Text style={{...text,color:palette.muted,marginTop:6}}>{fa?'عنوان، مواد اولیه و مراحل پخت در گوشی ذخیره می‌شوند. تصاویر جداگانه دانلود می‌شوند.':'Titles, ingredients and cooking steps are stored locally. Images are downloaded separately.'}</Text>
      <Text style={{...text,marginTop:8}}>{fa?`${offlineLibrary.length} دستور ذخیره‌شده`:`${offlineLibrary.length} saved recipes`}</Text>
      {libraryNotice?<Text accessibilityLiveRegion="polite" style={{...text,color:palette.primary,marginTop:7}}>{libraryNotice.status==='corrupt'||libraryNotice.status==='invalid-shape'?(fa?'داده‌های قبلی کتابخانه قابل‌خواندن نبودند؛ کتابخانه خالی بارگذاری شد. با ذخیره دوباره می‌توان داده‌های معتبر را ثبت کرد.':'The saved library could not be read. An empty library was loaded; saving again will write valid data.'):(fa?`کتابخانه بازیابی شد؛ ${libraryNotice.skipped} مورد نامعتبر و ${libraryNotice.duplicates} مورد تکراری نادیده گرفته شد.`:`Library recovered; skipped ${libraryNotice.skipped} invalid and ${libraryNotice.duplicates} duplicate entries.`)}</Text>:null}
      <Text accessibilityLiveRegion="polite" style={{...text,color:palette.muted,marginTop:7}}>{fa?`علاقه‌مندی‌ها: ${readiness.ready} آماده · ${readiness.outdated} نیازمند به‌روزرسانی · ${readiness['not-saved']} ذخیره‌نشده`:`Favorites: ${readiness.ready} ready · ${readiness.outdated} outdated · ${readiness['not-saved']} not saved`}</Text>
      <TouchableOpacity accessibilityRole="button" disabled={libraryBusy || !favoriteRecipeSnapshots(recipes,favoriteIds).length} onPress={saveFavoritesOffline} style={[button,{opacity:(libraryBusy || !favoriteRecipeSnapshots(recipes,favoriteIds).length) ? 0.5 : 1}]}>
        <Text style={text}>{fa?'ذخیره / به‌روزرسانی دستورهای علاقه‌مندی':'Save / update favorite recipes offline'}</Text>
      </TouchableOpacity>
      {offlineLibrary.length===0?<Text style={{...text,color:palette.muted,marginTop:9}}>{fa?'هنوز دستور آفلاینی ذخیره نشده است.':'No offline recipes yet.'}</Text>:offlineLibrary.map(item=><View key={item.id} style={{...row,gap:8}}>
        <TouchableOpacity accessibilityRole="button" disabled={libraryBusy} onPress={()=>deleteOfflineRecipe(item.id)} style={{padding:8}}><Text style={{color:palette.primary}}>{fa?'حذف':'Remove'}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={{flex:1}} onPress={()=>onOpenOfflineRecipe?.(item)}><Text style={{...text,fontWeight:'700'}} numberOfLines={2}>{item.title}</Text><Text style={{...text,color:palette.muted,fontSize:12}}>{fa?'مشاهده دستور':'Open recipe'} · {statusLabel(offlineRecipeStatus(currentById.get(String(item.id)) || item,offlineLibrary))}</Text></TouchableOpacity>
      </View>)}
    </View>
    <Text style={{...text,color:palette.muted,marginTop:14}}>{fa?'حداکثر تصاویر ذخیره‌شده':'Maximum saved images'}</Text>
    <View style={{flexDirection:fa?'row-reverse':'row',gap:8,marginTop:8}}>
      {[20,40,60].map(value => <TouchableOpacity key={value} accessibilityRole="button"
        accessibilityState={{selected:limit===value,disabled:busy}} disabled={busy}
        onPress={async()=>{setBusy(true);try{await setOfflineImageLimit(value);await refresh();}catch{setError(true);}finally{setBusy(false);}}}
        style={{flex:1,padding:10,alignItems:'center',borderRadius:10,borderWidth:1,borderColor:limit===value?palette.primary:palette.border,backgroundColor:palette.background}}>
        <Text style={{color:palette.ink,fontWeight:limit===value?'800':'400'}}>{value}</Text>
      </TouchableOpacity>)}
    </View>
    <Text style={{...text,color:palette.muted,marginTop:14}}>{fa?'تصاویر دانلودشده (آخرین استفاده در ابتدا)':'Downloaded images (recently used first)'}</Text>
    {files.length===0?<Text style={{...text,color:palette.muted,marginTop:8}}>{fa?'هنوز تصویری ذخیره نشده است.':'No images saved yet.'}</Text>:files.map((file,index)=><View key={file.name} style={row}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={fa?`حذف تصویر ${index+1}`:`Delete image ${index+1}`} disabled={busy} onPress={()=>removeOne(file.name)} style={{padding:8,borderRadius:8,borderWidth:1,borderColor:palette.border}}>
        <Text style={{color:palette.primary}}>{fa?'حذف':'Delete'}</Text>
      </TouchableOpacity>
      <View style={{flexDirection:fa?'row-reverse':'row',alignItems:'center',gap:10,flexShrink:1}}>
        <Image source={{uri:file.uri}} style={{width:48,height:48,borderRadius:9,backgroundColor:palette.border}} accessibilityLabel={fa?'پیش‌نمایش تصویر ذخیره‌شده':'Cached image preview'}/>
      <Text style={text}>{fa?'تصویر':'Image'} {index+1} · {formatCacheBytes(file.bytes,language)}</Text></View>
    </View>)}
    {error?<Text style={{color:palette.primary,marginTop:8}}>{fa?'خواندن حافظه ناموفق بود.':'Could not read storage.'}</Text>:null}
    {busy?<ActivityIndicator color={palette.primary} style={{marginTop:12}}/>:null}
    <TouchableOpacity accessibilityRole="button" disabled={busy} style={button} onPress={refresh}><Text style={text}>{fa?'به‌روزرسانی آمار':'Refresh storage stats'}</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" disabled={busy||!stats?.count} style={[button,{opacity:(busy || !stats?.count) ? 0.5 : 1}]} onPress={clear}><Text style={{color:palette.primary,fontWeight:'800'}}>{fa?'پاک‌سازی تصاویر ذخیره‌شده':'Clear downloaded images'}</Text></TouchableOpacity>
  </View>;
}
