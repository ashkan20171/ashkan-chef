import React from 'react';
import {View,Text} from 'react-native';
import {formatStatValue} from '../utils/statDisplay.mjs';

/** Accessible compact KPI card; theme and locale are supplied by the parent. */
export default function ChefStatCard({label,value,emoji,language='fa',palette}) {
 const formatted=formatStatValue(value,language);
 return <View accessible accessibilityLabel={`${label}: ${formatted}`} style={{flex:1,minWidth:0,minHeight:108,backgroundColor:palette.background,borderRadius:18,paddingVertical:14,paddingHorizontal:6,alignItems:'center',justifyContent:'center',gap:7,borderWidth:1,borderColor:palette.border}}>
  <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{fontSize:21}}>{emoji}</Text>
  <Text adjustsFontSizeToFit numberOfLines={1} style={{fontSize:23,fontWeight:'900',color:palette.primary}}>{formatted}</Text>
  <Text numberOfLines={2} style={{fontSize:11,color:palette.muted,textAlign:'center',fontWeight:'600'}}>{label}</Text>
 </View>;
}
