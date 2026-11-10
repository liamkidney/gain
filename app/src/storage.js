// All application persistence goes through this adapter; cloud sync can be added later.
const STORES=['workouts','templates','customExercises'];
export class LocalStore {
  constructor(channel='prod') {this.name=`gain-${channel}-v1`;this.db=null;}
  async open() { if(this.db)return this.db; this.db=await new Promise((resolve,reject)=>{const req=indexedDB.open(this.name,1);req.onupgradeneeded=()=>{for(const name of STORES)if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Gain storage is blocked by another tab.'));}); return this.db; }
  async all(store) {await this.open();return new Promise((resolve,reject)=>{const r=this.db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async put(store,record) {await this.open();return new Promise((resolve,reject)=>{const tx=this.db.transaction(store,'readwrite');tx.objectStore(store).put(structuredClone(record));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  async remove(store,id) {await this.open();return new Promise((resolve,reject)=>{const tx=this.db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  async bulkMerge(data) {await this.open();return new Promise((resolve,reject)=>{const tx=this.db.transaction(STORES,'readwrite');for(const store of STORES)for(const record of data[store])tx.objectStore(store).put(structuredClone(record));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
}
