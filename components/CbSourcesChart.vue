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
                <div style="color:#fff;margin: 0 1rem;">
                    {{ title }}
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
import { MONTH_NAMES, empty } from "~/utils";
import $moment from "moment";

export default {
    name: 'CbSourcesChart',
    async setup(){
        const store = useDataStore();
        await store.read();
        const vehicles = store.vehiclesAll;
        const informants = [{name: 'Не указан', n: 0}];
        const managers   = [{name: 'Не указан', n: 0}];
        const payments   = [];
        const dt = new Date();
        
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
           
            /* payments */
            if ( v.ticks?.length > 0 ){
                v.ticks.forEach( t => {
                    if ( t.pay ){
                        let pdt = $moment(t.dt);
                        if (dt.getFullYear()===pdt.year()){
                            let n = payments.findIndex( p => (p.month === pdt.month()) && (p.pay == t.pay) );
                            if ( n < 0 ){
                                payments.push({
                                    month: pdt.month(),
                                    pay: t.pay,
                                    count: 1,
                                    num: Number(t.num)
                                });
                            } else {
                                payments[n].count++;
                                payments[n].num += Number(t.num);
                            }
                        }
                    }
                });
            }
        });
        return {
            managers,
            informants: informants.sort( (i1, i2) => {return i2.n - i1.n; } ),
            payments: payments.sort( (p1, p2) => { return p1.month === p2.month ? 0 : p1.month < p2.month ? -1 : 1 }),
            total: vehicles.length
        };
    },
    data(){
        return {
            show: false,
            mode: 0
        };
    },
    computed: {
        title(){
            const _NAMES = {
                0: 'Распределение информации по источникам',
                1: 'Распределение путевок по менеджерам' ,
                2: 'Распределение оплат по месяцам' 
            };
            return _NAMES[this.mode] || '';
        }
    },
    methods: {
        /**
         * show chart by
         * @param {integer} q: "0"-informants, "1"-managers, "2" - payments
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
            } else if (q === 2){
                console.log('payments', this.payments);
                
                const months = [],
                      refs   = [],
                      datasets = [];
              
                this.payments.forEach( p => {
                    if (months.findIndex( m => m === p.month) < 0){
                        months.push(p.month);
                    }
                    if (refs.findIndex( r => r === p.pay) < 0){
                        refs.push(p.pay);
                    }
                });
                    
                refs.forEach( r => {
                    datasets.push({
                        label: r,
                        data:  months.map( m => {
                            let val = 0;
                            this.payments.filter( p => (p.pay === r) && (p.month === m) )
                                .forEach( p => { val += p.count });
                            return val;
                        })
                    })
                });
                
                datasets.forEach( ds => {
                    ds.total = 0;
                    ds.data.forEach( d => { ds.total+= d; });
                });
                max = datasets.reduce((prev, current) => (prev.total > current.total) ? prev : current).total;
                datasets.forEach( ds => {
                    ds.backgroundColor = `hsla(${ Math.trunc( ds.total*240 / max)}, 100%, 60%, 0.8)`;
                    ds.borderColor = `hsla(${ Math.trunc( ds.total*240 / max)}, 100%, 40%, 1)`;
                });
                
                console.log('datasets',datasets);
                
                cfg = {
                        type: 'bar',
                        responsive: true,
                        label: `Оплаты (${this.total} записей всего)`,
                        data: {
                                labels: months.map( m => {
                                    let n = MONTH_NAMES.findIndex( mn => m === mn.id );
                                    return ( n < 0 ) ? '' : MONTH_NAMES[n].name;
                                }),
                                datasets
                        },
                        options: {
                            scales: {
                                x: {
                                    stacked: true,
                                },
                                y: {
                                    stacked: true
                                }
                            }
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