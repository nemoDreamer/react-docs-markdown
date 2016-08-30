import table from 'markdown-table';
import { getKey, getTypeName, isComplexType } from './helpers';

export function describeType(type, level = 0) {
  switch (type.name) {
    case 'shape':
      return shape(type.value, level);
    case 'enum':
      return enumType(type.value);
    case 'union':
      return union(type.value, level);
    case 'arrayOf':
      return arrayOf(type.value, level);
    default:
      return type.value || type.name;
  }
}

export function describeSubTypes(types, level = 0) {
  const keys = Object.keys(types);

  let subTypes = '';
  let index = 0;
  for (const key of keys) {
    const prop = types[key];
    // Type can either be on the prop, or in the type field depending on depth.
    const type = prop.type || prop;

    if (isComplexType(type.name)) {
      const result = describeType(type, level);
      if (result) {
        if (level === 0 && index) subTypes += `\n${'-'.repeat(80)}\n`;
        subTypes += `\n###${'#'.repeat(level)} ${key}\nType: _${getTypeName(type)}_\n`;
        if (prop.description) subTypes += `\n${prop.description}\n`;

        if (level === 0) {
          // Add description on first level
          let typeDescription;
          switch (type.name) {
            case 'arrayOf':
              typeDescription = `**${key}** is an array of the following type:`;
              break;
            case 'shape':
              typeDescription = `**${key}** is an object with:`;
              break;
            case 'enum':
              typeDescription = `**${key}** should be one of the following values:`;
              break;
            case 'union':
              typeDescription = `**${key}** should be one of the following types:`;
              break;
            default:
              break;
          }

          if (typeDescription) subTypes += `\n${typeDescription}\n`;
        }

        subTypes += `${result}`;
      }
    }

    index += 1;
  }

  return subTypes;
}

export function arrayOf(type, level) {
  return describeType(type, level);
}

export function enumType(values) {
  return values.reduce((output, value) => `${output}* ${value.value}\n`, '\n');
}

export function shape(types, level) {
  let output = '';
  const keys = Object.keys(types);
  const tableValues = [['Name', 'Type', 'Required']];

  for (const key of keys) {
    const type = types[key];
    tableValues.push([getKey(key, type), getTypeName(type), type.required]);
  }
  output += `\n${table(tableValues)}\n`;

  const subTypes = describeSubTypes(types, level + 1);

  if (subTypes) {
    output += subTypes;
  }

  return output;
}

export function union(types, level) {
  let index = 1;
  return types.reduce((output, type) => `${output}\n**${index++}) ${getTypeName(type)}**\n${describeType(type, level)}`, '');
}
