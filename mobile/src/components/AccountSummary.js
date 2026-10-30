import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,ActivityIndicator,Alert,Image} from 'react-native';
import {changeMyPassword,getMyActivity,getMyStats,getMyAnalytics,revokeAllSessions,signOut,uploadRecipeImage,updateMyAvatar} from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import {formatRecipeDate} from '../utils/recipeDate';
import {ratingLabel} from '../utils/analytics';
import AnalyticsBarChart from './AnalyticsBarChart';
import ChefStatCard from './ChefStatCard';
import ChefProfileHeader from './ChefProfileHeader';

/** Authenticated profile editor. Server is authoritative; local display name is separate. */
export default function AccountSummary({user,isGuest,language='fa',palette,loading=false,error='',onRefresh,onSave,onSessionExpired}) {
 const fa=language==='fa';
 const tr=(a,b)=>fa?a:b;
 const align=fa?'right':'left';
 const [name,setName]=useState(user?.name||'');
 const [saving,setSaving]=useState(false);
 const [avatarBusy,setAvatarBusy]=useState(false);
 const [avatarError,setAvatarError]=useState('');
 const [saveError,setSaveError]=useState('');
 const [stats,setStats]=useState(null);
 const [analytics,setAnalytics]=useState(null);
 const [analyticsWindow,setAnalyticsWindow]=useState(12);
 const [analyticsError,setAnalyticsError]=useState('');
 const [activity,setActivity]=useState([]);
 useEffect(()=>{let active=true;setAnalytics(null);setAnalyticsError('');if(!isGuest){getMyAnalytics().then(v=>{if(active)setAnalytics(v)}).catch(()=>{if(active)setAnalyticsError(tr('آمار تحلیلی در دسترس نیست.','Analytics unavailable.'))})}return()=>{active=false}},[user?.id,isGuest]);
 const [activityPage,setActivityPage]=useState(1);
 const [activityTotal,setActivityTotal]=useState(0);
 const [activityHasMore,setActivityHasMore]=useState(false);
 const [activityBusy,setActivityBusy]=useState(false);
 const [activityError,setActivityError]=useState('');
 const [statsBusy,setStatsBusy]=useState(false);
 const [statsError,setStatsError]=useState('');
 const [currentPassword,setCurrentPassword]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [securityBusy,setSecurityBusy]=useState(false);
 const [securityError,setSecurityError]=useState('');
 useEffect(()=>{let active=true;setStats(null);setStatsError('');if(!isGuest){setStatsBusy(true);getMyStats().then(data=>{if(active)setStats(data)}).catch(()=>{if(active)setStatsError(tr('آمار در دسترس نیست.','Stats unavailable.'))}).finally(()=>{if(active)setStatsBusy(false)})}return()=>{active=false}},[user?.id,isGuest]);
 useEffect(()=>{setActivityPage(1);setActivity([]);setActivityTotal(0);setActivityHasMore(false)},[user?.id,isGuest]);
 useEffect(()=>{let active=true;setActivity([]);setActivityError('');if(!isGuest){setActivityBusy(true);getMyActivity(activityPage).then(data=>{if(active){setActivity(Array.isArray(data?.recentRecipes)?data.recentRecipes:[]);setActivityTotal(data?.total??0);setActivityHasMore(!!data?.hasMore)}}).catch(()=>{if(active)setActivityError(tr('فعالیت‌ها در دسترس نیستند.','Activity unavailable.'))}).finally(()=>{if(active)setActivityBusy(false)})}return()=>{active=false}},[user?.id,isGuest,activityPage]);
 const chooseAvatar=async()=>{
  const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!permission.granted){setAvatarError(tr('دسترسی به گالری لازم است.','Photo library permission is required.'));return;}
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.8});
  if(result.canceled||!result.assets?.length)return;
  setAvatarBusy(true);setAvatarError('');
  try{const url=await uploadRecipeImage(result.assets[0]);await updateMyAvatar(url);await onRefresh?.();}
  catch(e){setAvatarError(e?.message||tr('آپلود ناموفق بود.','Upload failed.'));}
  finally{setAvatarBusy(false);}
 };
 const removeAvatar=()=>Alert.alert(tr('حذف تصویر پروفایل','Remove profile photo'),tr('تصویر پروفایل حذف شود؟','Remove your profile photo?'),[
  {text:tr('انصراف','Cancel'),style:'cancel'},
  {text:tr('حذف','Remove'),style:'destructive',onPress:async()=>{setAvatarBusy(true);setAvatarError('');try{await updateMyAvatar(null);await onRefresh?.();}catch(e){setAvatarError(e?.message||tr('حذف تصویر ناموفق بود.','Could not remove photo.'));}finally{setAvatarBusy(false);}}}
 ]);
 const changePassword=async()=>{
  if(newPassword.length<10||newPassword.length>128){setSecurityError(tr('رمز جدید باید ۱۰ تا ۱۲۸ نویسه باشد.','New password must be 10–128 characters.'));return;}
  setSecurityBusy(true);setSecurityError('');
  try{await changeMyPassword(currentPassword,newPassword);setCurrentPassword('');setNewPassword('');Alert.alert(tr('موفق','Success'),tr('رمز عبور تغییر کرد. لطفاً دوباره وارد شوید.','Password updated. Please sign in again.'));await signOut();onSessionExpired?.();}
  catch(e){setSecurityError(e?.message||tr('خطای سرور','Server error'));}
  finally{setSecurityBusy(false)}
 };
 useEffect(()=>{setName(user?.name||'');},[user?.id,user?.name]);
 const revokeSessions=()=>Alert.alert(tr('خروج از همه دستگاه‌ها','Sign out everywhere'),tr('تمام نشست‌های فعلی غیرفعال شوند؟','Revoke all active sessions?'),[
  {text:tr('انصراف','Cancel'),style:'cancel'},
  {text:tr('تأیید','Confirm'),style:'destructive',onPress:async()=>{setSecurityBusy(true);setSecurityError('');try{await revokeAllSessions();await signOut();onSessionExpired?.();Alert.alert(tr('انجام شد','Done'),tr('لطفاً دوباره وارد شوید.','Please sign in again.'));}catch(e){setSecurityError(e.message||tr('خطا','Error'));}finally{setSecurityBusy(false);}}}
 ]);
 const save=async()=>{
  const value=name.trim();
  if(value.length<2||value.length>80){setSaveError(tr('نام باید بین ۲ تا ۸۰ نویسه باشد.','Name must be 2–80 characters.'));return;}
  setSaving(true);setSaveError('');
  try{await onSave(value);Alert.alert(tr('موفق','Saved'),tr('نام حساب به‌روزرسانی شد.','Your profile was updated.'));}
  catch(e){setSaveError(e?.message||tr('خطا در ذخیره','Unable to save'));}
  finally{setSaving(false);}
 };
 return <View style={{width:'100%',padding:12,borderRadius:20,backgroundColor:palette.background,gap:14}}>
  <Text style={{fontSize:17,fontWeight:'800',color:palette.ink,textAlign:align}}>{tr('حساب آنلاین','Online account')}</Text>
  {isGuest?<Text style={{color:palette.muted,textAlign:align}}>{tr('برای ویرایش پروفایل وارد حساب شوید.','Sign in to edit your profile.')}</Text>:<>
   <ChefProfileHeader user={user} language={language} palette={palette} busy={avatarBusy} onChoosePhoto={chooseAvatar} onRemovePhoto={removeAvatar}/>
   {!!avatarError&&<Text accessibilityRole="alert" style={{color:'#C64B40',textAlign:align}}>{avatarError}</Text>}
   <Text style={{color:palette.muted,textAlign:align}}>{tr('نام نمایشی','Display name')}</Text>
   <TextInput accessibilityLabel={tr('نام نمایشی','Display name')} value={name} onChangeText={setName} maxLength={80} autoCapitalize="words" style={{color:palette.ink,backgroundColor:palette.surface,borderColor:palette.border,borderWidth:1,borderRadius:12,padding:12,textAlign:align,writingDirection:fa?'rtl':'ltr'}}/>
   <Text style={{color:palette.muted,textAlign:align}} selectable>{user?.email||''}</Text>
   {!isGuest&&<View style={{padding:16,borderRadius:18,backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border,gap:10}}>
    <Text style={{fontSize:17,fontWeight:'800',color:palette.ink,textAlign:align}}>{tr('روند انتشار دستورها','Recipe publication trend')}</Text>
    {analytics?<>
      <Text style={{color:palette.muted,textAlign:align}}>{tr('میانگین امتیاز','Average rating')}: {ratingLabel(analytics.averageRating)} ★  ·  {analytics.reviewCount} {tr('نظر','reviews')}</Text>
      <View style={{flexDirection:fa?'row-reverse':'row',gap:8}}>{[3,6,12].map(n=><TouchableOpacity key={n} accessibilityRole="button" accessibilityState={{selected:analyticsWindow===n}} onPress={()=>setAnalyticsWindow(n)} style={{paddingVertical:7,paddingHorizontal:14,borderRadius:12,backgroundColor:analyticsWindow===n?palette.primary:palette.background}}><Text style={{color:analyticsWindow===n?'#fff':palette.ink}}>{n} {tr('ماه','months')}</Text></TouchableOpacity>)}</View>
      <AnalyticsBarChart rows={analytics.months} windowSize={analyticsWindow} language={language} palette={palette} title={tr('روند انتشار دستورها','Recipe publication')} summaryLabel={tr('انتشار در بازه انتخابی','Published in selected period')} height={74}/>
      <AnalyticsBarChart rows={analytics.followerMonths} windowSize={analyticsWindow} language={language} palette={palette} title={tr('رشد دنبال‌کنندگان','New followers')} summaryLabel={tr('دنبال‌کننده جدید در بازه','New follows in selected period')} height={64}/>
      <Text style={{fontSize:15,fontWeight:'800',color:palette.ink,textAlign:align}}>{tr('محبوب‌ترین دستورهای من','My most reviewed recipes')}</Text>
      {(analytics.topRecipes||[]).length===0?<Text style={{color:palette.muted,textAlign:align}}>{tr('هنوز امتیازی ثبت نشده است.','No reviews yet.')}</Text>:(analytics.topRecipes||[]).filter(x=>x.reviewCount>0).map(x=><View key={x.id} style={{flexDirection:fa?'row-reverse':'row',justifyContent:'space-between',gap:10}}><Text numberOfLines={1} style={{color:palette.ink,flex:1,textAlign:align}}>{x.title}</Text><Text style={{color:palette.muted}}>{x.reviewCount} · ★ {ratingLabel(x.averageRating)}</Text></View>)}
    </>:<Text style={{color:palette.muted,textAlign:align}}>{analyticsError||tr('در حال دریافت آمار…','Loading analytics…')}</Text>}
   </View>}
   <View style={{width:'100%',padding:16,borderRadius:18,backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border,gap:12}}><View style={{flexDirection:fa?'row-reverse':'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:palette.ink,fontSize:19,fontWeight:'900',textAlign:align}}>{tr('داشبورد آشپز','Chef dashboard')}</Text><Text accessibilityLabel={tr('نمای کلی حساب','Account overview')} style={{color:palette.primary,fontSize:20}}>✦</Text></View>{statsBusy?<ActivityIndicator color={palette.primary}/>:stats?<View style={{flexDirection:fa?'row-reverse':'row',justifyContent:'space-between',gap:6}}>{[['recipes','🍲','دستورها','Recipes'],['followers','👥','دنبال‌کننده','Followers'],['following','❤️','دنبال‌شده','Following']].map(([key,emoji,faLabel,enLabel])=><ChefStatCard key={key} label={tr(faLabel,enLabel)} value={stats[key]} emoji={emoji} language={language} palette={palette}/>)}</View>:<Text style={{color:palette.muted,textAlign:align}}>{statsError||tr('آماری موجود نیست.','No stats available.')}</Text>}</View>
   <View style={{padding:16,borderRadius:18,backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border,gap:10}}>
    <Text style={{color:palette.ink,fontSize:17,fontWeight:'800',textAlign:align}}>{tr('دستورهای اخیر من','My recent recipes')}</Text>
    {activityBusy?<ActivityIndicator color={palette.primary}/>:activityError?<Text accessibilityRole="alert" style={{color:palette.muted,textAlign:align}}>{activityError}</Text>:activity.length===0?<Text style={{color:palette.muted,textAlign:align}}>{tr('هنوز دستوری منتشر نکرده‌اید.','You have not published any recipes yet.')}</Text>:activity.map(item=><View key={item.id} style={{flexDirection:fa?'row-reverse':'row',alignItems:'center',gap:12,paddingVertical:7,borderBottomWidth:1,borderColor:palette.border}}>
      {item.imageUrl?<Image source={{uri:item.imageUrl}} style={{width:54,height:54,borderRadius:12}}/>:<View style={{width:54,height:54,borderRadius:12,backgroundColor:palette.background,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:23}}>🍲</Text></View>}
      <View style={{flex:1,gap:4}}><Text numberOfLines={2} style={{color:palette.ink,fontWeight:'700',textAlign:align}}>{item.title}</Text><Text style={{color:palette.muted,fontSize:12,textAlign:align}}>{formatRecipeDate(item.createdAt,language)||tr('تاریخ نامشخص','Date unavailable')}</Text></View>
    </View>)}
    {!isGuest&&activityTotal>0&&<View style={{flexDirection:fa?'row-reverse':'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
      <TouchableOpacity accessibilityRole="button" disabled={activityBusy||activityPage<=1} onPress={()=>setActivityPage(p=>Math.max(1,p-1))} style={{padding:10,opacity:activityPage<=1?.4:1}}><Text style={{color:palette.primary,fontWeight:'700'}}>{tr('قبلی','Previous')}</Text></TouchableOpacity>
      <Text style={{color:palette.muted}}>{tr('صفحه','Page')} {activityPage} / {Math.ceil(activityTotal/8)}</Text>
      <TouchableOpacity accessibilityRole="button" disabled={activityBusy||!activityHasMore} onPress={()=>setActivityPage(p=>p+1)} style={{padding:10,opacity:activityHasMore?1:.4}}><Text style={{color:palette.primary,fontWeight:'700'}}>{tr('بعدی','Next')}</Text></TouchableOpacity>
    </View>}
   </View>
   {!!(error||saveError)&&<Text accessibilityRole="alert" style={{color:'#C64B40',textAlign:align}}>{saveError||error}</Text>}
   <TouchableOpacity accessibilityRole="button" disabled={saving||loading||!onSave} onPress={save} style={{backgroundColor:palette.primary,padding:13,borderRadius:12,alignItems:'center',opacity:saving?.6:1}}>{saving?<ActivityIndicator color="white"/>:<Text style={{color:'white',fontWeight:'800'}}>{tr('ذخیره تغییرات','Save changes')}</Text>}</TouchableOpacity>
   <Text style={{fontSize:16,fontWeight:'800',color:palette.ink,textAlign:align,marginTop:14}}>{tr('امنیت حساب','Account security')}</Text>
   <TextInput accessibilityLabel={tr('رمز فعلی','Current password')} placeholder={tr('رمز فعلی','Current password')} placeholderTextColor={palette.muted} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} autoCapitalize="none" style={{color:palette.ink,backgroundColor:palette.surface,borderRadius:12,padding:12,textAlign:align}}/>
   <TextInput accessibilityLabel={tr('رمز جدید','New password')} placeholder={tr('رمز جدید (حداقل ۱۰ نویسه)','New password (at least 10 characters)')} placeholderTextColor={palette.muted} secureTextEntry value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" style={{color:palette.ink,backgroundColor:palette.surface,borderRadius:12,padding:12,textAlign:align}}/>
   {!!securityError&&<Text accessibilityRole="alert" style={{color:'#C64B40',textAlign:align}}>{securityError}</Text>}
   <TouchableOpacity accessibilityRole="button" disabled={securityBusy||!currentPassword||!newPassword} onPress={changePassword} style={{backgroundColor:palette.primary,padding:13,borderRadius:12,alignItems:'center',opacity:securityBusy?.6:1}}><Text style={{color:'white',fontWeight:'800'}}>{tr('تغییر رمز عبور','Change password')}</Text></TouchableOpacity>
   <TouchableOpacity accessibilityRole="button" disabled={securityBusy} onPress={revokeSessions} style={{padding:13,borderRadius:12,borderWidth:1,borderColor:'#C64B40',alignItems:'center'}}><Text style={{color:'#C64B40',fontWeight:'800'}}>{tr('خروج از همه دستگاه‌ها','Sign out everywhere')}</Text></TouchableOpacity>
   <TouchableOpacity accessibilityRole="button" disabled={loading||saving} onPress={onRefresh} style={{padding:12,alignItems:'center'}}>{loading?<ActivityIndicator color={palette.primary}/>:<Text style={{color:palette.primary,fontWeight:'700'}}>{tr('دریافت دوباره اطلاعات','Refresh account')}</Text>}</TouchableOpacity>
  </>}
 </View>;
}
