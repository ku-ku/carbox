<template>
    <v-dialog v-model="show"
              width="720"
              min-height="640"
              scrollable
              content-class="cb-informants">
        <v-card>
            <v-toolbar color="primary"
                       density="compact"
                       dark>
                <div style="color:#fff;margin: 0 1rem">
                    {{ (mode == 0) ? 'Распределение информации по источникам' : 'Распределение путевок по менеджерам' }}
                </div>
                <v-spacer />
                <v-btn icon
                       v-on:click="show=false">
                    <v-icon size="small"
                            color="white">
                        mdi-close
                    </v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text>
                <div>
                    <canvas id="chart"></canvas>
                </div>    
            </v-card-text>
        </v-card>    
    </v-dialog>
</template>
<script>
import Chart from 'chart.js/auto';    
import { useDataStore } from "~/store/data";
import { empty } from "~/utils";
    
export default {
    name: 'CbSourcesChart',
    async setup(){
        const store = useDataStore();
        await store.read();
        const vehicles = store.vehiclesAll;
        const informants = [{name: 'Не указан', n: 0}];
        const managers   = [{name: 'Не указан', n: 0}];
        
        vehicles.forEach( v => {
            /* informants */
            if ( empty(v.informant) ){
                informants[0].n++;
            } else {
                let n = informants.findIndex( i => i.name.localeCompare(v.informant)===0 );
                if ( n > 0 ){
                    informants[n].n++;
                } else {
                    informants.push({name: v.informant, n: 1});
                }
            }
            
            /* managers */
            if ( Number(v.lastTick?.num) > 0 ) {
                if ( empty(v.manaName) ){
                    managers[0].n += Number(v.lastTick.num);
                } else {
                    let m = managers.findIndex( m => m.name.localeCompare(v.manaName)===0 );
                    if ( m > 0 ){
                        managers[m].n += Number(v.lastTick.num);
                    } else {
                        managers.push({name: v.manaName, n: Number(v.lastTick.num)});
                    }
                }
            }
        });
        return {
            managers,
            informants: informants.sort( (i1, i2) => {return i2.n - i1.n; } ),
            total: vehicles.length
        };
    },
    data(){
        return {
            show: false,
            mode: 0
        };
    },
    methods: {
        /**
         * show chart by
         * @param {integer} q: "0"-informants, "1"-managers
         * @returns {undefined}
         */
        open(q = 0){
            
            let cfg, max = 0;
            if (q === 0){
                if ( !(this.informants?.length > 0) ){
                    return;
                }
                
                max = this.informants.reduce((prev, current) => (prev.n > current.n) ? prev : current).n;
                if (max < 1){
                    return;
                }
                cfg = {
                        type: 'bar',
                        data: {
                                labels: this.informants.map( i => i.name ),
                                axis: 'y',
                                datasets: [{
                                        label: `Источники (${this.total} записей всего)`,
                                        data: this.informants.map( i => i.n ),
                                        backgroundColor: this.informants.map( i => {
                                            return `hsla(${ Math.trunc( i.n*240 / max)}, 100%, 60%, 0.8)`;
                                        }),
                                        borderColor: this.informants.map( i => {
                                            return `hsla(${ Math.trunc( i.n*240 / max)}, 100%, 40%, 1)`;
                                        })
                                }]
                        },
                        options: {
                            indexAxis: 'y'
                        }
                    };
            } else if (q === 1){
                console.log('managers', this.managers);
                if ( !(this.managers?.length > 0) ){
                    return;
                }
                max = this.managers.reduce((prev, current) => (prev.n > current.n) ? prev : current).n;
                if (max < 1){
                    return;
                }
                cfg = {
                        type: 'doughnut',
                        data: {
                                labels: this.managers.map( m => m.name ),
                                datasets: [{
                                        clip: {left: 10, top: 10, right: 10, bottom: 10},
                                        label: `Распределение путевок по менеджерам`,
                                        data: this.managers.map( m => m.n ),
                                        backgroundColor: this.managers.map( m => {
                                            return `hsla(${ Math.trunc( m.n*240 / max)}, 100%, 60%, 0.8)`;
                                        }),
                                        hoverOffset: 8
                               }]
                        }
                };
            }
            
            if ( cfg ){
                this.mode = q;
                this.show = true;
                this.$nextTick(()=>{
                    new Chart(document.getElementById("chart"), cfg);
                });
            }
            
        }   //open
    }
}    
</script>
<style lang="scss" scoped>
    .cb-informants {
        background: #fff;
        #chart {
            min-height: 420px;
        }
    }
</style>