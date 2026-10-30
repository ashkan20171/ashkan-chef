import React, {useMemo, useState} from 'react';
import {View, Text, Pressable} from 'react-native';
import {chartSummary} from '../utils/analytics';
import {formatAnalyticsCount, chartEmptyMessage} from '../utils/analyticsDisplay.mjs';

/** Accessible, dependency-free interactive monthly bar chart. */
export default function AnalyticsBarChart({rows, windowSize=12, language='fa', palette, title, summaryLabel, height=94}) {
 const fa=language==='fa';
 const [selected,setSelected]=useState(null);
 const summary=useMemo(()=>chartSummary(rows,windowSize),[rows,windowSize]);
 const selectedMonth=summary.months.find(m=>`${m.year}-${m.month}`===selected);
 const hasActivity=summary.months.some(m=>m.count>0);
 const count=value=>formatAnalyticsCount(value,language);
 return <View style={{gap:10}}>
  <Text style={{color:palette.ink,fontWeight:'800',fontSize:15,textAlign:fa?'right':'left'}}>{title}</Text>
  <View style={{flexDirection:fa?'row-reverse':'row',justifyContent:'space-between',gap:8}}>
   <Text style={{color:palette.muted,flex:1,textAlign:fa?'right':'left'}}>{summaryLabel}</Text>
   <Text accessibilityLabel={`${summaryLabel}: ${summary.total}`} style={{color:palette.primary,fontWeight:'900',fontSize:18}}>{count(summary.total)}</Text>
  </View>
  {summary.months.length===0?<Text style={{color:palette.muted,textAlign:fa?'right':'left'}}>{chartEmptyMessage(language)}</Text>:<>
   <View style={{flexDirection:'row',height:height+33,alignItems:'flex-end',gap:4}}>
    {summary.months.map(m=>{
     const key=`${m.year}-${m.month}`;
     const active=key===selected;
     return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${m.year}/${m.month}: ${m.count}`} accessibilityState={{selected:active}} onPress={()=>setSelected(active?null:key)} style={{flex:1,alignItems:'center',justifyContent:'flex-end',gap:4,minHeight:height+25}}>
      <Text style={{color:active?palette.primary:palette.muted,fontSize:10,fontWeight:active?'800':'400'}}>{count(m.count)}</Text>
      <View style={{height:Math.max(4,height*m.count/summary.peak),width:'80%',borderRadius:6,backgroundColor:palette.primary,opacity:active?1:.65}}/>
      <Text style={{color:palette.muted,fontSize:10}}>{m.month}</Text>
     </Pressable>;
    })}
   </View>
   {!hasActivity&&<Text style={{color:palette.muted,textAlign:fa?'right':'left'}}>{chartEmptyMessage(language)}</Text>}
   {selectedMonth&&<Text accessibilityLiveRegion="polite" style={{color:palette.ink,textAlign:fa?'right':'left'}}>{`${selectedMonth.year}/${selectedMonth.month}: ${count(selectedMonth.count)}`}</Text>}
  </>}
 </View>;
}
