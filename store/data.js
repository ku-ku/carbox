import { unref, toRaw } from "vue";
import { defineStore } from "pinia";
import { useSettingsStore } from "./settings";
import { empty } from "~/utils";
import $moment from "moment";
$moment.locale('ru');

export const useDataStore = defineStore('data', {
    state: () => ({
        /** 
         * active(selected)
         */
        vehicle: null,
        /**
         * all loaded
         */
        vehicles: [],
        /**
         * references
         */
        town: [],
        model: [],
        manager: [],
        payment: [{name: '-'},{name: 'Наличные'},{name: 'Яндекс'},{name: 'Перевод'}],
        osago:   [{name: '-'},{name: 'ОСАГО'},{name: 'ОСАГО (такси)'}],
        informant: []
    }),
    
    actions: {
        async read( id = undefined, s = undefined ){
            return new Promise(async (resolve, reject) => {
                const byId = (typeof id !== "undefined");
                if ( byId ){
                    const n = this.vehicles.findIndex( v => v.id == id);
                    if ( n > -1){
                        resolve(this.vehicles[n]);
                        return;
                    }
                }
                
                if (this.vehicles.length > 0){
                    resolve();
                } else {
                    let url = '/taxi/v1/taxi/';
                    if ( byId ){
                        url += '?id=' + id;
                    }

                    if ( !empty( s ) ) {
                        url += '?s=' + s;
                    }

                    try {
                        const res = await $nuxt.api({ url });
                        console.log('vehicles', res);
                        if (  byId  ){
                            if (res.data.value.data.length > 0) {
                                this.vehicles.push(res.data.value.data[0]);
                                resolve(res.data.value.data[0]);
                            } else {
                                reject({message: `No id ${ id } found`});
                            }
                        } else {
                            this.vehicles = res.data.value.data;
                            if (this.vehicles?.length > 0){
                                const setts = useSettingsStore();
                                setts.settings.at = new Date(this.vehicles[0].modified);
                            }
                            resolve();
                        }
                    } catch(e){
                        console.log('ERR (vehicles)', e);
                        reject(e);
                    }
                }
            });
        },  //read
        async save( { value } ){
            console.log('saving', value);
            return new Promise(async (resolve, reject) => {
                const url = `/taxi/v1/taxi/`;
                
                try {
                    const taxi = { ...value };
                    
                    taxi.ticks = [];
                    
                    value.ticks?.forEach( t => {
                        var t = unref(t);
                        taxi.ticks.push({
                                num: t.num,
                                dt:  t.dt,
                                pay: t.pay,
                                note: t.note
                            });
                    });
                    
                    const {data, error} = await $nuxt.api({
                        url, 
                        method: 'POST', 
                        body: JSON.stringify( { taxi } ),
                        headers: {"Content-Type": "application/json; charset=utf-8"}
                    });
                    if (data.value.success){
                        const {town, model, informant} = value;
                        let n;
                        if ( !empty(town) ){
                            n = this.town.findIndex( t => t.name.toLowerCase() === town.toLowerCase() );
                            if ( n < 0 ){
                                this.town.push({id: town, name: town});
                            }
                        }
                        if ( !empty(model) ){
                            n = this.model.findIndex( m => m.name.toLowerCase() === model.toLowerCase() );
                            if ( n < 0 ){
                                this.model.push({id: model, name: model});
                            }
                        }
                        if ( !empty(informant) ){
                            n = this.informant.findIndex( i => i.name.toLowerCase() === informant?.toLowerCase() );
                            if ( n < 0 ){
                                this.informant.push({id: informant, name: informant});
                            }
                        }
                        this.vehicle = data.value.data;
                        resolve(this.vehicle);
                    } else if ( (data.value.error)||(error) ) {
                        reject(data.value.error||error);
                    }
                } catch(e){
                    console.log('ERR (save vehicle)', e);
                    reject(e);
                }
            });
        },  //
        async remove( id ){
            return new Promise(async (resolve, reject) => {
                const url = `/taxi/v1/taxi/`;
                try {
                    const {data, error} = await $nuxt.api({
                        url, 
                        method: 'POST', 
                        body: JSON.stringify({taxi:{id, rm: 1}}),
                        headers: {"Content-Type": "application/json; charset=utf-8"}
                    });
                    if (data.value.success){
                        const n = this.vehicles.findIndex( v => v.id == id );
                        if ( n > -1 ){
                            this.vehicles.splice(n, 1);
                        }
                        resolve();
                    } else if ((data.value.error)||(error)) {
                        reject(data.value.error||error);
                    }
                } catch(e){
                    console.log('ERR (remove vehicle)', e);
                    reject(e);
                }
            });
        },  //remove
    
        async references( q ){
            return new Promise(async (resolve, reject) => {
                
                const o = {error: false, items: undefined};
                
                if ( this[q]?.length < 1 ){
                    try {
                        const url = `/taxi/v1/references/?q=${ q }`;
                        const { data, error } = await $nuxt.api({ url });
                        console.log(`references (${ q })`, data);
                        if (data.value.success){
                            this[q] = data.value.data;
                        } else {
                            o.error = error || data.value.error;
                        }
                    } catch(e){
                        console.log('ERR (references)', e);
                        o.error = e;
                    }
                }
                if (!o.error){
                    o.items = this[q];
                    resolve(o);
                } else {
                    reject(o.error);
                }
            });
        }   //references
    },      //actions
    
    getters: {
        vehiclesAll: state => {
            const { period } = useSettingsStore().settings.local;
            const now = period.year * 100 + period.month;
            return state.vehicles?.map( v => {
                if  (Number.isNaN(Number(v.manager))){
                    v.manaName = v.manager;
                } else {
                    let n = state.manager.findIndex( m => m.id == v.manager);
                    v.manaName = ( n < 0) ? '' : state.manager[n].name;
                }
                if (v.ticks?.length > 0){
                    let lastTick;
                    v.ticks.map( t => {
                        t.dt = $moment(t.dt);
                        t.paid = (!!t.pay);
                        if ( now === t.dt.get('year') * 100 + t.dt.get('month') ){
                            lastTick = t;
                        }
                        return t;
                    });
                    v.lastTick = lastTick;
                }
                
                return v;
            });
        },  //vehicles
        count: state => {
            return state.vehicles?.length;
        },
        /**
         * Returns the total permits & payments
         *
         * @returns {Object}
         */        
        payments(){
            const totals = {
                num: 0,
                paids: 0
            };
            this.vehiclesAll?.forEach( v => {
                if ( v.lastTick ){
                    totals.num += (v.lastTick.num) ? Number(v.lastTick.num) : 0;
                    totals.paids += (v.lastTick.paid) ? 1 : 0;
                }
            });
            return totals;
        }
    }       //getters
    
});
