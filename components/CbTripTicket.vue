<template>
    <v-dialog v-model="show"
              scroll
              max-width="720"
              min-height="640"
              content-class="cb-trip-ticket">
        <v-toolbar density="compact"
                   dark
                   color="primary">
            <v-toolbar-title class="text-uppercase" style="color:#fff;">
                {{ vehicle.gov }}<span class="period">{{ period }}</span>
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon
                   v-on:click="show=false">
                <v-icon size="small"
                        color="white">
                    mdi-close
                </v-icon>
            </v-btn>
        </v-toolbar>
        <v-form ref="form"
                fast-fail
                v-on:submit.stop.prevent="save">
            <v-card flat>
                <v-card-text>
                    <v-row>
                        <v-col cols="12" sm="6" 
                               class="d-flex align-baseline justify-start flex-wrap">
                            <cb-date-input label="на дату" 
                                           ref="dt"
                                           type="date" 
                                           :value="dt"
                                           name="tickdt"
                                           required
                                           v-on:ondate="set('dt', $event)" />
                            <v-tooltip text="сегодня">
                                <template v-slot:activator="{ props }">
                                    <v-btn size="small"
                                           variant="text"
                                           v-bind="props"
                                           v-on:click="set('dt', new Date())">
                                        <v-icon>mdi-calendar-today-outline</v-icon>
                                    </v-btn>
                                </template>
                            </v-tooltip>
                            <div class="cb-trip-last">
                                <a href="#" v-html="lastDt" 
                                   v-on:click.stop.prevent="set('dt', null)"></a>
                            </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field label="количество путевок"
                                          v-model="num"
                                          type="number"
                                          clearable
                                          :rules="[ rules.empty, rules.isint ]" 
                                          data-selected-all="1"
                                  ></v-text-field>
                        </v-col>    
                    </v-row>
                    <v-row>
                        <v-col cols="12">
                            <v-autocomplete label="оплата"
                                            item-title="name"
                                            item-value="name"
                                            autocomplete="off"
                                            :return-object="false"
                                            :items="payments"
                                            v-model="pay">
                            </v-autocomplete>
                        </v-col>
                    </v-row>    
                    <v-row>
                        <v-col cols="12">
                            <v-text-field label="примечание"
                                          v-model="note"
                                          clearable>
                                              
                            </v-text-field>
                        </v-col>
                    </v-row>    
                </v-card-text>
                <v-card-actions class="py-5">
                    <v-btn size="small"
                           prepend-icon="mdi-close"
                           v-on:click="show = false">
                        закрыть
                    </v-btn>
                    <v-btn color="primary"
                           type="submit"
                           size="small"
                           variant="elevated">
                        записать
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>    
    </v-dialog>
</template>
<script>
import $moment from "moment";
$moment.locale('ru');
import { ref, unref } from "vue";
import { useDataStore } from "~/store/data";
import { empty } from "~/utils";

const rules = {
            empty: val => !empty(val) || "Необходимо заполнить",
            isint: val => Number.isInteger(Number.parseInt(val)) || 'Введите числовое значение'
};

export default {
    name: 'CbTripTicket',
    data(){
        return {
            rules,
            payments: useDataStore().payment,
            show: false,
            vehicle: null,
            ticks: [],   //copy for modify & saving
            dt: null,
            pay: null,
            num: null,
            note: null
        };
    },
    computed: {
        lastDt(){
            return (this.vehicle?.lastTick) ? `последняя инф.от:&nbsp;${ this.vehicle.lastTick.dt.format("DD.MM.YYYY") }` : '';
        },
        period(){
            if (this.dt){
                let m = $moment(this.dt);
                return m.isValid() ? m.format('MMM, YYYY') : '';
            }
            return '';
        }
    },
    methods: {
        open(vehicle){
            this.vehicle = vehicle;
            this.ticks = [];
            if (typeof vehicle.ticks !=="undefined") {
                this.ticks = this.ticks.concat([...vehicle.ticks].map( t => { 
                                    var t = unref(t);
                                    if (typeof t.note === "undefined"){
                                        t.note = null;
                                    }
                                    return { ...t };
                            })
                );
            }
            this.dt = null;
            this.pay= null;
            this.num= null;
            this.note= null;
            console.log('ticks', this.ticks);
            this.show = true;
            this.$nextTick(()=>{
                $("form").find("input[name=tickdt]").trigger("focus");
            });
        },
        set(q, val){
            switch(q){
                case 'dt':
                    let _val = (val) ? val : this.vehicle.lastTick?.dt;
                    this.dt = _val;
                    if ( _val ){
                        const n = this.ticks.findIndex( t => $moment(_val).format('YYYYMM')==$moment(t.dt).format('YYYYMM') );
                        if ( n > -1){
                            this.pay = this.ticks[n].pay;
                            this.num = this.ticks[n].num;
                            this.note = this.ticks[n].note;
                        }
                        this.$nextTick(()=>{
                            this.$refs["dt"].resetValidation();
                        });
                    }
                    break;
            }
        },  //set
        save(){
            if ( !this.$refs["form"].validate() ){
                return false;
            }
            
            const ticks = [...this.ticks];
            const n = ticks.findIndex( t => $moment(t.dt).format('YYYYMM') == $moment(this.dt).format('YYYYMM') );
            if ( n > -1 ){
                ticks.splice( n, 1 );
            }
            ticks.push({dt: this.dt, num: this.num, pay: this.pay, note: this.note});
            this.vehicle.ticks = ref(ticks);
            const ds = useDataStore();
            ds.save( ref(this.vehicle) ).then( ({data, error}) => {
                console.log('save data', data);
                setTimeout(()=>{
                    this.show = false;
                }, 500);
                this.$emit('onchange', this.vehicle);
            }).catch( e => {
                console.log('ERR save', e);
                $nuxt.msg({text: 'Ошибка сохранения изменений', color: 'warning'});
            });
                
            return false;
        }
    }
}    
</script>
<style lang="scss" scoped>
    .cb-trip-ticket{
        & .period{
            font-size: 0.85rem;
            margin-left: 1rem;
        }
        & .v-card{
            &-actions{
                justify-content: flex-end;
            }
        }
        & .cb-trip-last{
            width: 100%;
            a {
                font-size: 0.85rem;
                color: #333;
                text-decoration: none;
                padding-bottom: 3px;
                border-bottom: 1px dotted #a9a9a9;
            }
        }
    }
</style>
