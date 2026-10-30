/** Pure profile view helpers, independent of React Native. */
export function profileDirection(language='fa') { return language==='fa'?'row-reverse':'row'; }
export function profileAlignment(language='fa') { return language==='fa'?'right':'left'; }
export function profileDisplayName(name,language='fa') {
 const safe=typeof name==='string'?name.trim():'';
 return safe || (language==='fa'?'آشپز مهمان':'Guest chef');
}
