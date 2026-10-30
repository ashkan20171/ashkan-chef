import {resolveRecipeImage} from '../utils/recipeImages.mjs';
import React,{useEffect,useState} from 'react';
import {View,Text,Image,Pressable,StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import ImageSkeleton from './ImageSkeleton';
import {getOfflineImage, saveOfflineImage} from '../services/persistentImageCache';
import {imageSourceState, shouldPersistLoadedImage} from '../utils/offlineImageState.mjs';
import {canRetryImage, nextImageAttempt} from '../utils/imageRetry.mjs';

/** Presentation-only card. All mutations are handled by the parent. */
export default function RecipeCard({recipe,isFavorite,onOpen,onFavorite,palette,language,minutesLabel,caloriesLabel,offlineStatus=null,onSaveOffline,offlineBusy=false}){
  const [imageFailed,setImageFailed]=useState(false);
  const [imageLoading,setImageLoading]=useState(true);
  const [offlineUri,setOfflineUri]=useState(null);
  const [lookupPending,setLookupPending]=useState(Boolean(recipe?.image));
  const [imageAttempts,setImageAttempts]=useState(0);
  const imageUrl=resolveRecipeImage(recipe);
  const resolved=imageSourceState(imageUrl,offlineUri,lookupPending);
  useEffect(()=>{setImageFailed(false);setImageLoading(true);setOfflineUri(null);setLookupPending(Boolean(imageUrl));setImageAttempts(0);},[recipe?.id,imageUrl]);
  useEffect(()=>{
    let active=true;
    if(!imageUrl){setLookupPending(false);return ()=>{active=false;};}
    getOfflineImage(imageUrl).then(uri=>{if(active)setOfflineUri(uri);}).catch(()=>{if(active)setOfflineUri(null);}).finally(()=>{if(active)setLookupPending(false);});
    return ()=>{active=false;};
  },[imageUrl,imageAttempts]);
  const rtl=language==='fa';
  const direction=rtl?'right':'left';
  return <View style={[styles.card,{backgroundColor:palette.surface,borderColor:palette.border}]}>
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${recipe.title} — ${recipe.minutes} ${minutesLabel}`} accessibilityHint={rtl?'باز کردن جزئیات و مراحل پخت':'Open recipe details and cooking steps'}>
      <View style={styles.media}>
        {!imageFailed&&Boolean(imageUrl)&&resolved.ready?<Image source={{uri:resolved.source,cache:'force-cache'}} style={styles.image} resizeMode="cover" onLoadStart={()=>setImageLoading(true)} onLoad={()=>{setImageLoading(false);if(shouldPersistLoadedImage(imageUrl,resolved.offline,true))saveOfflineImage(imageUrl).catch(()=>{});}} onLoadEnd={()=>setImageLoading(false)} onError={()=>{if(resolved.offline){setOfflineUri(null);setImageLoading(true);}else{setImageFailed(true);setImageLoading(false);}}} accessibilityLabel={rtl?`تصویر ${recipe.title}`:`Photo of ${recipe.title}`}/>:<View style={[styles.fallback,{backgroundColor:palette.background}]}><Ionicons name="restaurant-outline" size={45} color={palette.primary}/></View>}
        {imageFailed&&canRetryImage(imageUrl,true,imageAttempts)?<Pressable accessibilityRole="button" accessibilityLabel={rtl?'تلاش دوباره برای بارگذاری تصویر':'Retry image loading'} onPress={()=>{setImageAttempts(current=>nextImageAttempt(current));setImageFailed(false);setImageLoading(true);setOfflineUri(null);setLookupPending(Boolean(imageUrl));}} style={[styles.imageRetry,{backgroundColor:palette.surface,borderColor:palette.border}]}><Ionicons name="refresh-outline" size={17} color={palette.primary}/><Text style={{color:palette.ink,fontSize:12,fontWeight:'800'}}>{rtl?'تلاش دوباره':'Retry image'}</Text></Pressable>:null}
        {imageLoading&&!imageFailed&&Boolean(imageUrl)?<ImageSkeleton palette={palette} compact />:null}
        <LinearGradient colors={['transparent','rgba(16,24,25,0.75)']} style={styles.gradient}/>
        <View style={[styles.imageCaption,{alignItems:rtl?'flex-end':'flex-start'}]}>
          <Text style={styles.difficulty}>{recipe.difficulty}</Text>
          <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.title,{textAlign:direction}]}>{recipe.title}</Text>
        </View>
      </View>
      <View style={[styles.meta,{flexDirection:rtl?'row-reverse':'row',flexWrap:'wrap'}]}>
        <View style={styles.pill}><Ionicons name="time-outline" color={palette.primary} size={16}/><Text style={[styles.metaText,{color:palette.ink}]}>{recipe.minutes} {minutesLabel}</Text></View>
        <View style={styles.pill}><Ionicons name="flame-outline" color={palette.primary} size={16}/><Text style={[styles.metaText,{color:palette.ink}]}>{recipe.calories} {caloriesLabel}</Text></View>
        <Ionicons name={rtl?'arrow-back-circle-outline':'arrow-forward-circle-outline'} color={palette.primary} size={23}/>
      </View>
    </Pressable>
    {offlineStatus&&onSaveOffline?<View style={[styles.offlineRow,{borderTopColor:palette.border,flexDirection:rtl?'row-reverse':'row'}]}>
      <View style={styles.offlineLabel}><Ionicons name={offlineStatus==='ready'?'checkmark-circle-outline':offlineStatus==='outdated'?'alert-circle-outline':'cloud-download-outline'} color={offlineStatus==='ready'?palette.green:palette.primary} size={18}/><Text style={{color:palette.ink,fontSize:12,fontWeight:'700'}}>{rtl?({'ready':'آماده آفلاین','outdated':'نیازمند به‌روزرسانی','not-saved':'ذخیره‌نشده','unavailable':'ناموجود'}[offlineStatus]):({'ready':'Ready offline','outdated':'Update available','not-saved':'Not saved','unavailable':'Unavailable'}[offlineStatus])}</Text></View>
      {offlineStatus!=='unavailable'?<Pressable accessibilityRole="button" accessibilityLabel={rtl?'ذخیره یا به‌روزرسانی دستور آفلاین':'Save or update offline recipe'} disabled={offlineBusy} onPress={onSaveOffline} style={[styles.offlineAction,{borderColor:palette.border,opacity:offlineBusy?.5:1}]}><Ionicons name="download-outline" color={palette.primary} size={16}/><Text style={{color:palette.primary,fontWeight:'800',fontSize:12}}>{offlineBusy?(rtl?'در حال ذخیره':'Saving'):(offlineStatus==='ready'?(rtl?'ذخیره مجدد':'Save again'):(rtl?'ذخیره آفلاین':'Save offline'))}</Text></Pressable>:null}
    </View>:null}
    <Pressable onPress={onFavorite} hitSlop={10} accessibilityRole="button" accessibilityLabel={isFavorite?(rtl?'حذف از علاقه‌مندی‌ها':'Remove favorite'):(rtl?'افزودن به علاقه‌مندی‌ها':'Add favorite')} accessibilityState={{selected:!!isFavorite}} accessibilityHint={rtl?"برای تغییر وضعیت علاقه‌مندی لمس کنید":"Tap to toggle favorite"} style={[styles.favorite,{backgroundColor:palette.surface}]}>
      <Ionicons name={isFavorite?'heart':'heart-outline'} color={palette.primary} size={23}/>
    </Pressable>
  </View>;
}
const styles=StyleSheet.create({
 card:{borderWidth:1,borderRadius:24,overflow:'hidden',marginBottom:18},
 imageLoading:{position:"absolute",top:0,bottom:0,left:0,right:0,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(16,24,25,0.12)"},
 media:{height:230,position:'relative'},image:{width:'100%',height:'100%'},fallback:{height:'100%',alignItems:'center',justifyContent:'center'},imageRetry:{position:'absolute',alignSelf:'center',top:94,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:13,paddingVertical:9,borderWidth:1,borderRadius:12},
 gradient:{position:'absolute',bottom:0,left:0,right:0,height:150},imageCaption:{position:'absolute',bottom:18,left:18,right:18},
 difficulty:{color:'#FFE7C9',fontSize:12,fontWeight:'800',marginBottom:5},title:{color:'#FFFFFF',fontSize:23,fontWeight:'900',lineHeight:31},
 meta:{paddingHorizontal:16,paddingVertical:14,alignItems:'center',gap:14},pill:{flexDirection:'row',alignItems:'center',gap:6},metaText:{fontSize:12,fontWeight:'700'},
 offlineRow:{paddingHorizontal:16,paddingVertical:10,borderTopWidth:1,alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'},offlineLabel:{flexDirection:'row',alignItems:'center',gap:6},offlineAction:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:7,borderRadius:10,borderWidth:1},
 favorite:{position:'absolute',top:14,right:14,padding:11,borderRadius:15,elevation:3}
});
