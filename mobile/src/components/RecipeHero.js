import {resolveRecipeImage} from '../utils/recipeImages.mjs';
import {canRetryImage, nextImageAttempt} from '../utils/imageRetry.mjs';
import React, {useEffect, useState} from 'react';
import {View, Image, Text, StyleSheet, Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import ImageSkeleton from './ImageSkeleton';
import {getOfflineImage, saveOfflineImage} from '../services/persistentImageCache';
import {imageSourceState, shouldPersistLoadedImage} from '../utils/offlineImageState.mjs';

/** Accessible, resilient recipe detail hero with an image fallback. */
export default function RecipeHero({recipe, language, palette}) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [offlineUri, setOfflineUri] = useState(null);
  const [lookupPending, setLookupPending] = useState(true);
  useEffect(() => { setFailed(false); setLoading(true); setAttempt(0); }, [recipe?.id, recipe?.image]);
  const isPersian = language === 'fa';
  const imageUrl = resolveRecipeImage(recipe);
  const validImage = Boolean(imageUrl);
  const resolved = imageSourceState(imageUrl, offlineUri, lookupPending);
  useEffect(() => {
    let active = true;
    setOfflineUri(null);
    setLookupPending(Boolean(imageUrl));
    if (imageUrl) getOfflineImage(imageUrl)
      .then(uri => { if (active) setOfflineUri(uri); })
      .catch(() => { if (active) setOfflineUri(null); })
      .finally(() => { if (active) setLookupPending(false); });
    return () => { active = false; };
  }, [imageUrl]);
  return <View style={[styles.hero, {backgroundColor: palette.surface}]}>
    {validImage && !failed && resolved.ready ? <Image
      key={`${recipe?.id ?? imageUrl}-${attempt}`} source={{uri: resolved.source, cache: 'force-cache'}} style={styles.image} resizeMode="cover"
      accessibilityLabel={isPersian ? `تصویر ${recipe.title}` : `Photo of ${recipe.title}`}
      onLoadStart={() => setLoading(true)} onLoad={() => {setLoading(false); if (shouldPersistLoadedImage(imageUrl, resolved.offline, true)) saveOfflineImage(imageUrl).catch(()=>{});}}
      onLoadEnd={() => setLoading(false)}
      onError={() => {setFailed(true); setLoading(false);}}
    /> : validImage && !failed && !resolved.ready ? <View style={styles.fallback} /> : <View style={styles.fallback} accessibilityLabel={isPersian ? 'تصویر غذا در دسترس نیست' : 'Recipe image unavailable'}>
      <Ionicons name="restaurant-outline" size={58} color={palette.primary}/>
      <Text style={[styles.fallbackText, {color:palette.muted}]}>{isPersian ? 'تصویر موجود نیست' : 'Image unavailable'}</Text>
    </View>}
    {canRetryImage(imageUrl, failed, attempt) ? <Pressable accessibilityRole="button" accessibilityLabel={isPersian ? 'تلاش دوباره برای دریافت تصویر' : 'Retry loading image'} onPress={() => {setFailed(false); setLoading(true); setAttempt(nextImageAttempt);}} style={[styles.retry, {backgroundColor: palette.primary}]}><Ionicons name="refresh" size={17} color="#FFFFFF"/><Text style={styles.retryText}>{isPersian ? 'تلاش دوباره' : 'Retry image'}</Text></Pressable> : null}
    {validImage && !failed && (loading || !resolved.ready) ? <ImageSkeleton palette={palette} /> : null}
  </View>;
}
const styles=StyleSheet.create({
  hero:{height:270,overflow:'hidden'},image:{width:'100%',height:'100%'},
  fallback:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
  fallbackText:{fontSize:14,fontWeight:'700'},
  retry:{position:'absolute',bottom:16,alignSelf:'center',flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:18,paddingVertical:12,borderRadius:14,minHeight:44},
  retryText:{color:'#FFFFFF',fontWeight:'800',fontSize:14},
  loading:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.08)'}
});
