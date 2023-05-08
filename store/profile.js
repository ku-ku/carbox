import { unref } from 'vue';
import { defineStore } from 'pinia';
import { useSettingsStore } from "~/store/settings";

export const useProfileStore = defineStore('profile', {
    state: () => ({
        subject: {id: -1}
    }),
    actions: {
        /**
         * Check session when exists
         * @returns {Promise}
         */
        async pre(){
            return new Promise(async (resolve, reject)=>{
                if (this.subject.id > 0){
                    resolve(this.subject);
                } else {
                    try {
                        document.cookie = "wordpress_test_cookie=WP%20Cookie%20check";
                        const opts = {
                            url:'/taxi/v1/exo',
                            method: 'GET',
                            headers: new Headers()
                        };
                        
                        const setts = useSettingsStore().settings;
                        if (setts.nonce){
                            opts.headers.append("X-WP-Nonce", setts.nonce);
                        }
                        
                        
                        let {data, error} = await $nuxt.api(opts);
                        
                        if (error.value){
                            throw error.value;
                        }
                        
                        if ( !data.value.success ){
                            throw {message: data.value.data?.error || 'unknown error'};
                        } else {
                            this.subject = data.value.data;
                            resolve(this.subject);
                        }
                    } catch(e){
                        console.log('ERR (pre)', e);
                        reject(e);
                    }                    
                }
            });
            
        },  //pre
        async auth(payload){
            return new Promise(async (resolve, reject)=>{
                if (this.subject.id > 0){
                    resolve(this.subject);
                } else {
                    try {
                        let {data, error} = await $nuxt.api({
                            url:'/taxi/v1/exo',
                            method: 'POST',
                            body: JSON.stringify({exo: {u: payload.u, p: payload.p}}),
                            headers: new Headers({
                              "Content-Type": "application/json; charset=UTF-8"
                            })
                        });
                        
                        console.log('AUTH', data, error);
                        if (error.value){
                            throw error.value;
                        }
                        
                        if ( !data.value.success ){
                            throw {message: data.value.data?.error || 'unknown error'};
                        } else {
                            this.subject = data.value.data;
                            resolve(this.subject);
                        }
                    } catch(e){
                        console.log('ERR (auth)', e);
                        reject(e);
                    }
                }
            });
        },   //auth
        async logout(){
            this.subject = {id: -1};
            return $nuxt.api({
                            url:'/taxi/v1/exo?logout=1',
                            method: 'POST',
                            body: JSON.stringify({exo: {logout: 1}}),
                            headers: new Headers({
                              "Content-Type": "application/json; charset=UTF-8"
                            })
                   });
        }   //signout
    }
});