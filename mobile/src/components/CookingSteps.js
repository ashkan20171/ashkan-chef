import React from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

/** Accessible, theme-aware guided cooking. State is owned by the parent. */
export default function CookingSteps({steps=[],currentStep=0,onStepChange,onFinish,language='fa',palette}) {
  const isFa=language==='fa';
  if (!steps.length) return <Text style={{color:palette.muted}}>{isFa?'مرحله‌ای ثبت نشده است.':'No steps available.'}</Text>;
  const index=Math.max(0,Math.min(currentStep,steps.length-1));
  const progress=(index+1)/steps.length;
  const translateNumber=n=>isFa?String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]):String(n);
  return <View style={[styles.container,{backgroundColor:palette.surface,borderColor:palette.border}]}>
    <View style={[styles.top,{flexDirection:isFa?'row-reverse':'row'}]}>
      <Text style={[styles.label,{color:palette.primary}]}>{isFa?`مرحله ${translateNumber(index+1)} از ${translateNumber(steps.length)}`:`Step ${index+1} of ${steps.length}`}</Text>
      <Text style={{color:palette.muted}}>{Math.round(progress*100)}%</Text>
    </View>
    <View style={[styles.track,{backgroundColor:palette.border}]} accessibilityLabel={isFa?'پیشرفت آموزش':'Cooking progress'}>
      <View style={[styles.fill,{width:`${progress*100}%`,backgroundColor:palette.primary}]}/>
    </View>
    <Text accessibilityRole="text" style={[styles.instruction,{color:palette.ink,textAlign:isFa?'right':'left',writingDirection:isFa?'rtl':'ltr'}]}>{steps[index]}</Text>
    <View style={[styles.actions,{flexDirection:isFa?'row-reverse':'row'}]}>
      <Pressable accessibilityRole="button" accessibilityLabel={isFa?'مرحله قبلی':'Previous step'} disabled={index===0} onPress={()=>onStepChange(index-1)} style={[styles.button,{borderColor:palette.border,opacity:index===0?.4:1}]}>
        <Ionicons name="chevron-back" size={17} color={palette.ink}/><Text style={{color:palette.ink,fontWeight:'700'}}>{isFa?'قبلی':'Previous'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={index===steps.length-1?(isFa?'پایان آموزش':'Finish cooking'):(isFa?'مرحله بعد':'Next step')} onPress={()=>index===steps.length-1?onFinish():onStepChange(index+1)} style={[styles.button,{backgroundColor:palette.primary,borderColor:palette.primary}]}>
        <Text style={{color:'#fff',fontWeight:'800'}}>{index===steps.length-1?(isFa?'پایان آموزش':'Finish'):(isFa?'مرحله بعد':'Next')}</Text>
        <Ionicons name="chevron-forward" size={17} color="#fff"/>
      </Pressable>
    </View>
  </View>;
}
const styles=StyleSheet.create({container:{borderWidth:1,borderRadius:22,padding:18,gap:16},top:{justifyContent:'space-between',alignItems:'center'},label:{fontSize:15,fontWeight:'800'},track:{height:7,borderRadius:8,overflow:'hidden'},fill:{height:'100%',borderRadius:8},instruction:{fontSize:18,lineHeight:31,minHeight:100},actions:{flexDirection:'row',justifyContent:'space-between',gap:10},button:{borderWidth:1,borderRadius:14,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6}});
