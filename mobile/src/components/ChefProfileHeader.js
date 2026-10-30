import React from 'react';
import {View,Text,Image,TouchableOpacity,ActivityIndicator} from 'react-native';
import {profileDirection,profileDisplayName,profileAlignment} from '../utils/profileUi.mjs';

/** Reusable bilingual profile hero. Avatar changes remain authenticated server operations. */
export default function ChefProfileHeader({user,language='fa',palette,busy=false,onChoosePhoto,onRemovePhoto}) {
 const fa=language==='fa';
 const name=profileDisplayName(user?.name,language);
 const direction=profileDirection(language);
 const textAlign=profileAlignment(language);
 return <View style={{backgroundColor:palette.surface,borderColor:palette.border,borderWidth:1,borderRadius:24,padding:18,gap:16}}>
  <View style={{height:5,width:72,borderRadius:5,backgroundColor:palette.primary,alignSelf:fa?'flex-end':'flex-start'}} />
  <View style={{flexDirection:direction,alignItems:'center',gap:14}}>
   {user?.avatarUrl?<Image accessibilityLabel={fa?'تصویر پروفایل آشپز':'Chef profile photo'} source={{uri:user.avatarUrl}} style={{width:84,height:84,borderRadius:24,backgroundColor:palette.background}}/>:
   <View style={{width:84,height:84,borderRadius:24,backgroundColor:palette.primary,justifyContent:'center',alignItems:'center'}}><Text style={{fontSize:34,color:'#fff',fontWeight:'900'}}>{name.charAt(0).toUpperCase()}</Text></View>}
   <View style={{flex:1,gap:6}}>
    <Text style={{fontSize:12,color:palette.primary,fontWeight:'800',textAlign}}>{fa?'پروفایل آشپز':'CHEF PROFILE'}</Text>
    <Text numberOfLines={2} style={{fontSize:22,color:palette.ink,fontWeight:'900',textAlign}}>{name}</Text>
    <Text numberOfLines={1} style={{fontSize:12,color:palette.muted,textAlign}}>{user?.email||''}</Text>
   </View>
  </View>
  <View style={{flexDirection:direction,flexWrap:'wrap',gap:10}}>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel={fa?'تغییر تصویر پروفایل':'Change profile photo'} disabled={busy} onPress={onChoosePhoto} style={{backgroundColor:palette.primary,paddingHorizontal:16,paddingVertical:12,borderRadius:14,opacity:busy?.6:1,minHeight:44,justifyContent:'center'}}>
    {busy?<ActivityIndicator color="#fff"/>:<Text style={{color:'#fff',fontWeight:'800'}}>{fa?'تغییر تصویر':'Change photo'}</Text>}
   </TouchableOpacity>
   {!!user?.avatarUrl&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={fa?'حذف تصویر پروفایل':'Remove profile photo'} disabled={busy} onPress={onRemovePhoto} style={{borderWidth:1,borderColor:'#C64B40',paddingHorizontal:16,paddingVertical:12,borderRadius:14,minHeight:44,justifyContent:'center'}}><Text style={{color:'#C64B40',fontWeight:'800'}}>{fa?'حذف تصویر':'Remove photo'}</Text></TouchableOpacity>}
  </View>
 </View>;
}
