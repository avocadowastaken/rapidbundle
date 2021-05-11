import { isObjectLike } from 'lodash-es'
if (isObjectLike(process)) console.log(process.env);
