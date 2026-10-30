export function validateAuth({name='',email='',password='',register=false}) {
 const errors={};
 if(register&&name.trim().length<2)errors.name=true;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))errors.email=true;
 if(password.length<8)errors.password=true;
 return {valid:Object.keys(errors).length===0,errors};
}
