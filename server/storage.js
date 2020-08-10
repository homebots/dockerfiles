import { existsSync, writeFile, readFileSync } from './io.js';

async function save(target) {
  await writeFile(target.file, JSON.stringify(target.data));
}

function init(target, name) {
  target.file = `storage/${name}`;
  target.data = {};

  if (existsSync(target.file)) {
    const data = readFileSync(target.file);
    target.data = data && JSON.parse(data) || {};
  }
}

export class FileStorage {
  constructor(name) {
    init(this, name);
  }

  set(name, value) {
    this.data[name] = value;
    save(this);
  }

  get(name, defaultValue = null) {
    return this.data[name] || defaultValue;
  }

  getAll() {
    return Object.values(this.data);
  }

  has(name) {
    return name in this.data;
  }

  delete(name) {
    delete this.data[name];
    save(this);
  }

  static for(name) {
    return new FileStorage(name);
  }
}