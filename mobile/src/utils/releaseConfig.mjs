export function validateReleaseConfig(expo, eas) {
  const errors = [];
  if (!/^\d+\.\d+\.\d+$/.test(expo?.version ?? '')) errors.push('Invalid semantic version');
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(expo?.android?.package ?? '')) errors.push('Invalid Android package');
  if (!Number.isInteger(expo?.android?.versionCode) || expo.android.versionCode < 1) errors.push('Invalid Android versionCode');
  if (eas?.build?.production?.android?.buildType !== 'app-bundle') errors.push('Production Android build must use AAB');
  if (eas?.build?.preview?.android?.buildType !== 'apk') errors.push('Preview Android build must use APK');
  return errors;
}
