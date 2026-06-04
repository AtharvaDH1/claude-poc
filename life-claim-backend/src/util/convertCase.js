function camelToSnakeCase(obj) {
  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase();
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
}

function snakeToCamelCase(obj){
  const newObj = {}
  for(const key in obj){
    const camelKey = key.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
}


module.exports = { camelToSnakeCase , snakeToCamelCase};
