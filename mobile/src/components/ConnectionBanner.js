import React from 'react';
import {View,Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {connectionMessage} from '../utils/connectionStatus.mjs';

export default function ConnectionBanner({status,language='fa',palette}) {
  if (status !== 'offline') return null;
  const rtl = language !== 'en';
  return <View accessibilityRole="alert" style={{marginTop:12,padding:12,borderRadius:12,borderWidth:1,borderColor:palette.border,backgroundColor:palette.surface,flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:9}}>
    <Ionicons name="cloud-offline-outline" size={20} color={palette.primary}/>
    <Text style={{flex:1,color:palette.ink,textAlign:rtl?'right':'left',writingDirection:rtl?'rtl':'ltr',fontSize:13}}>{connectionMessage(status,language)}</Text>
  </View>;
}
