import AsyncStorage from '@react-native-async-storage/async-storage';
import {cacheKey,createCacheEntry,readCacheEntry} from '../utils/offlineRecipes.mjs';
import {ApiError, buildApiUrl, fetchWithTimeout} from '../utils/network.mjs';
import * as SecureStore from 'expo-secure-store';
import {shouldUseCachedRecipes} from '../utils/offlineApiPolicy.mjs';
import {createRecipeSyncTransport} from '../utils/recipeSyncTransport.mjs';
// Android emulator: 10.0.2.2; physical device: replace with your computer LAN IP.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5080';
const KEY='ashkan-chef-auth-token';
export async function request(path,{method='GET',body,authenticated=false,signal,headers={}}={}) {
 const token=authenticated?await SecureStore.getItemAsync(KEY):null;
 const response=await fetchWithTimeout(buildApiUrl(API_URL,path),{method,headers:{'Content-Type':'application/json',...headers,...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new ApiError(data.error || `HTTP ${response.status}`, response.status);
 return data;
}
export const signIn=async(email,password)=>{const data=await request('/api/auth/login',{method:'POST',body:{email,password}});await SecureStore.setItemAsync(KEY,data.token);return data;};
export const signUp=async(name,email,password)=>{const data=await request('/api/auth/register',{method:'POST',body:{name,email,password}});await SecureStore.setItemAsync(KEY,data.token);return data;};
export const signOut=()=>SecureStore.deleteItemAsync(KEY);
export const getToken=()=>SecureStore.getItemAsync(KEY);
export async function getCloudRecipes(page=1, search='', connectivity='unknown', signal) {
 const key=cacheKey(page,search);
 if (shouldUseCachedRecipes(connectivity)) {
  const cached=readCacheEntry(await AsyncStorage.getItem(key));
  if (cached) return {...cached,offline:true};
  const error=new Error('Offline and no cached recipes for this search');
  error.code='OFFLINE_CACHE_MISS';
  throw error;
 }
 try {
  const data=await request(`/api/recipes?page=${page}&search=${encodeURIComponent(search)}`,{signal});
  // Caching is best-effort and cannot prevent online browsing.
  try { await AsyncStorage.setItem(key,JSON.stringify(createCacheEntry(data))); } catch {}
  return {...data,offline:false};
 } catch(error) {
  // Only network failures/timeouts fall back to cache, never HTTP errors.
  if (!(error instanceof TypeError) && error?.code!=='TIMEOUT' && error?.code!=='NETWORK') throw error;
  try {
   const cached=readCacheEntry(await AsyncStorage.getItem(key));
   if(cached) return {...cached,offline:true};
  } catch {}
  throw error;
 }
}
export const createCloudRecipe=(recipe)=>request('/api/recipes',{method:'POST',body:recipe,authenticated:true});

export const deleteCloudRecipe=(id)=>request(`/api/recipes/${id}`,{method:'DELETE',authenticated:true});

export const getMyProfile=()=>request('/api/me',{authenticated:true});
export const getMyRecipes=(signal)=>request('/api/me/recipes',{authenticated:true,signal});
export const updateCloudRecipe=(id,recipe)=>request(`/api/recipes/${id}`,{method:'PUT',body:recipe,authenticated:true});

export const getRecipeReviews=(id)=>request(`/api/recipes/${id}/reviews`);
export const saveRecipeReview=(id,rating,comment)=>request(`/api/recipes/${id}/reviews/me`,{method:'PUT',body:{rating,comment},authenticated:true});
export const deleteMyReview=(id)=>request(`/api/recipes/${id}/reviews/me`,{method:'DELETE',authenticated:true});

export const getChef=(id)=>request(`/api/chefs/${id}`);
export const getFollowing=()=>request('/api/me/following',{authenticated:true});
export const followChef=(id)=>request(`/api/chefs/${id}/follow`,{method:'PUT',authenticated:true});
export const unfollowChef=(id)=>request(`/api/chefs/${id}/follow`,{method:'DELETE',authenticated:true});

// Authenticated multipart upload; do not manually set Content-Type (boundary is automatic).
export async function uploadRecipeImage(asset) {
 const token=await getToken();
 if(!token)throw new Error('ابتدا وارد حساب کاربری شوید.');
 const form=new FormData();
 form.append('file',{uri:asset.uri,name:asset.fileName||'recipe.jpg',type:asset.mimeType||'image/jpeg'});
 const response=await fetchWithTimeout(buildApiUrl(API_URL,'/api/media/images'),{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw new ApiError(result.error||`HTTP ${response.status}`, response.status);
 return result.url;
}

export const updateMyProfile=(name)=>request('/api/me',{method:'PUT',body:{name},authenticated:true});

export const changeMyPassword=(currentPassword,newPassword)=>request('/api/me/password',{method:'PUT',body:{currentPassword,newPassword},authenticated:true});
export const getMyStats=()=>request('/api/me/stats',{authenticated:true});

// Invalidates all previously issued tokens server-side.
export const revokeAllSessions=()=>request('/api/me/sessions/revoke',{method:'POST',authenticated:true});

export const updateMyAvatar=(avatarUrl)=>request('/api/me/avatar',{method:'PUT',body:{avatarUrl},authenticated:true});

export const getMyActivity=(page=1)=>request(`/api/me/activity?page=${encodeURIComponent(page)}`,{authenticated:true});

export const getMyAnalytics=()=>request('/api/me/analytics',{authenticated:true});

// Authenticated transport for the idempotent recipe synchronization API.
export const recipeSyncTransport=createRecipeSyncTransport(request);
