import { defineStore } from 'pinia';

const _LS_SETTS_KEY = "car-box",
      _now = new Date();

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        settings: {
            at: false,
            name: '',
            description: '',
            nonce: null,
            local: {
                period: {
                    month: _now.getMonth(),
                    year:  _now.getFullYear()
                }
            }
        }
    }),
    actions: {
        async read(){
            return new Promise(async (resolve, reject) => {
                if (this.settings.at){
                    resolve(this.settings);
                } else {
                    try {
                        const res = await $nuxt.api({ url:'/v1/kih/meta', cache: false });
                        const {name, description, nonce, at} = res.data.value.meta;
                        this.settings.name = name;
                        this.settings.description = description;
                        this.settings.nonce = nonce;
                        this.settings.at = new Date( at );
                        //local read
                        const s = window.localStorage.getItem(_LS_SETTS_KEY);
                        if ( (s) && /^\{+/.test(s) ){
                            this.settings.local = JSON.parse(s);
                        }
                        
                        resolve(this.settings);
                    }catch(e){
                        console.log('ERR (read)', e);
                        reject(e);
                    }
                }
            });
        },   //read
        save(){
            localStorage.setItem(_LS_SETTS_KEY, JSON.stringify(this.settings.local));
        }
    }
    
});