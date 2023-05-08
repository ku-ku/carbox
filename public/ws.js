/**
 * Web-worker for:
 * 1. BE-test connection, TODO: move base worker
 * 2. Data-caching by indexedDB 
 * 
 */
const _IDB_NAME = "carbox";
      
let dbPromise = null;
/**
 * ENV-context
 * @type type
 */
let env = null;

const on_bc_message = e => {
    console.log(`worker(message: ${e.data?.type})`, e);
    switch (e.data.type) {
        case "init":
            env = e.data.env;
            env.hTimer = setInterval(_ping, 5*60*1000);
            idbOpen();
            break;
        case "read":
            idbRead(e.data);
            break;
        case "save":
            idbSave(e.data);
            break;
    }
};



/** 
 * Basic-message communucition (for init)
 * @type type
 */
self.addEventListener('message', on_bc_message); 

/**
 * Test communication
 * TODO: -> jet-ext
 * @returns {undefined}
 */
const _ping = ()=>{
    if ( !env ){
        return;
    }
    fetch(`${ env.api }/taxi/v1/exo`)
            .then( r => {})
            .catch( e => {
                console.log('ERR (ping)', e);
                postMessage( {success:false, type:"lost"} );
            });
};

const idbOpen = ()=>{
    let db = null;
    dbPromise = new Promise( (resolve, reject)=>{
        if (typeof indexedDB === "undefined"){
            reject({error: "No indexedDB available"});
        } else if ( db ){
            resolve(db);
        } else {
            const req = indexedDB.open(_IDB_NAME, 2);
            req.onsuccess = e => {
                db = req.result;
                resolve(db);
            };
            req.onerror = e => {
                console.log('ERR (db)', e);
                reject({error:"ERR: can`t IDB open"});
            };
            req.onupgradeneeded = e => {
                db = e.target.result;
                db.createObjectStore("info");
                resolve(db);
            };    
        }
    });
};  //idbRead

const idbRead = async ( { name } )=>{
    console.log('reading from', name);
    try {
        if (!dbPromise) {
            throw { message: 'no database available' };
        }
        const db = await dbPromise;

        const obs = db.transaction("info").objectStore("info");
        const res = obs.get(name);

        res.onsuccess = e => {
            const o = {success: true, type: "read"};
            o[name] = e.target.result;
            postMessage( o );
        };
        res.onerror = e => {
            console.log(`ERR on read "${name}"`, res, e);
        };
    } catch(e){
        console.log(`ERR on read "${name}"`, e);
    }
};  //readData


const idbSave = async data => {
    try {
        if (!dbPromise) {
            throw { message: 'no database available' };
        }
        const db = await dbPromise;
        const obs = db.transaction("info", "readwrite").objectStore("info");
        try {
            obs.delete(data.name);
        }catch(e){}
        
        const res = obs.add(data.data, data.name);
        res.onerror = e => {
            console.log('(ERR) (worker-saving):', e);
        };
    } catch(err){
        console.log('(ERR) (worker-saving):', err);
    }
    
};  //idbSave