<template>
    <v-dialog v-model="show"
              scroll
              max-width="760"
              min-height="640"
              content-class="cb-trip-tickets">
        <v-toolbar density="compact"
                   dark
                   color="primary">
            <v-toolbar-title class="text-uppercase" style="color:#fff;">
                {{ vehicle.gov }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon="mdi-close"
                   color="white"
                   v-on:click="show=false">
            </v-btn>
        </v-toolbar>
        <v-card flat
                rouded="0">
            <v-card-text>
                <v-data-table density="compact"
                              :headers="headers"
                              :items="ticks"
                              :items-per-page="-1"
                              disable-pagination
                              hide-default-footer
                              single-select
                              ref="table">
                    <template v-slot:header.actions>
                        <div class="text-center"><v-icon>mdi-dots-vertical</v-icon></div>
                    </template>
                    <template v-slot:item="{index, item}">
                        <tr v-if="has('selected', item)"
                            class="selected" 
                            :key="'item-' + index">
                            <td>
                                <cb-date-input placeholder="Дата" 
                                               type="date"
                                               :value="item.raw.dt"
                                               v-on:ondate="item.raw.dt = $event"></cb-date-input>
                            </td>
                            <td class="text-right numof">
                                <v-text-field placeholder="Количество"
                                              type="number"
                                              data-selected-all="1"
                                              density="compact"
                                              v-model="item.raw.num"></v-text-field>
                            </td>
                            <td v-if="isadmin">
                                <v-autocomplete placeholder="Оплата"
                                    item-title="name"
                                    item-value="name"
                                    autocomplete="off"
                                    hide-details
                                    density="compact"
                                    :return-object="false"
                                    :items="payments"
                                    v-model="item.raw.pay">
                                </v-autocomplete>
                            </td>
                            <td class="note">
                                <v-text-field placeholder="примечание"
                                              data-selected-all="1"
                                              density="compact"
                                              v-model="item.raw.note"></v-text-field>
                            </td>
                            <td>
                                <v-btn size="small"
                                       flat
                                       icon="mdi-check-bold"
                                       v-on:click.stop="sel(-1)">
                                </v-btn>
                                <v-btn size="small"
                                       icon="mdi-close-thick"
                                       flat
                                       v-on:click.stop="sel(-1)">
                                </v-btn>
                            </td>
                        </tr>
                        <tr v-else
                            :key="'item-' + index">
                            <td>
                                {{ (item.raw.dt) ? $moment(item.raw.dt).format('DD.MM.YYYY') : null }}
                            </td>
                            <td  class="text-right numof">
                                {{ item.raw.num }}
                            </td>
                            <td v-if="isadmin">
                               {{ item.raw.pay }} 
                            </td>
                            <td class="text-truncate note">
                                {{ item.raw.note }}
                            </td>
                            <td class="actions">
                                <v-btn icon="mdi-file-document-edit"
                                       flat
                                       size="x-small"
                                       v-on:click.stop.prevent="sel(index)">
                                </v-btn>
                                <v-btn icon="mdi-delete" 
                                       flat
                                       size="x-small"
                                       v-on:click.stop.prevent="del(index)">
                                </v-btn>
                            </td>
                        </tr>
                    </template>
                </v-data-table>
            </v-card-text>
            <v-card-actions>
                <v-btn size="small"
                       prepend-icon="mdi-close"
                       v-on:click="show = false">
                    закрыть
                </v-btn>
                <v-btn color="primary"
                       size="small"
                       variant="elevated"
                       v-on:click="add">
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn color="primary"
                       size="small"
                       variant="elevated"
                       v-on:click="save">
                    ок
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { unref, ref, computed } from "vue";
import { useProfileStore } from "~/store/profile";
import { useDataStore } from "~/store/data";
import $moment from "moment";
$moment.locale('ru');

export default {
    name: 'CbTripTickets',
    setup(){
        const isadmin =  !!(useProfileStore().subject?.admin);
        
        const headers = [
                {
                    title: 'Дата',
                    align: 'center',
                    key:   'dt',
                    width: '8rem'
                },
                { 
                    title: 'Количество', 
                    align: 'end', 
                    key:   'num',
                    width: '5rem'
                },
                { 
                    title: 'Оплата', 
                    align: 'left', 
                    key:   'pay',
                    width: '9rem'
                },
                { 
                    title: 'примечание', 
                    align: 'left', 
                    key:   'note',
                    width: '10rem'
                },
                { title: ' ', align: 'center', value: 'acts' }
        ];
        
        if ( !isadmin ){
            headers.splice(2, 1);
        }
        
        return {
            isadmin,
            payments: useDataStore().payment,
            headers
        };
    },
    data(){
        return {
            $moment,
            show: false,
            vehicle: null,
            ticks: []   //copy for modify & saving
        };
    },
    methods: {
        log(v){
            console.log(v);
        },
        has(q, val){
            switch(q){
                case 'item':
                    console.log('has-item', val);
                    return true;
                case 'selected':
                    return !!val.raw?.selected;
            }
            return false;
        },
        open(vehicle){
            console.log('open (vehicle)', vehicle);
            this.vehicle = vehicle;
            this.ticks = [];
            if (typeof vehicle.ticks!=="undefined") {
                this.ticks = this.ticks.concat([...vehicle.ticks].map( t => { 
                                    var t = unref(t);
                                    t.selected = false; 
                                    if (typeof t.note === "undefined"){
                                        t.note = null;
                                    }
                                    return {...t};
                            })
                );
            }
            console.log('open (ticks)', this.ticks);
            this.show = true;
        },
        sel(n){
            console.log('sel #', n);
            this.ticks.forEach( (item, i) => {
                console.log(item);
                item.selected = (i === n);
            });
            if ( n > -1 ){
                this.$nextTick(()=>{
                    $(".cb-trip-tickets table td.numof input").focus().select();
                });
            }
        },
        add(){
            const item = {
                dt: new Date(),
                num: 0
            };
            item.dt.setHours(0,0,0,0);
            const n = this.ticks.push(item);
            this.sel( n - 1 );
        },
        del(n){
            const item = unref(this.ticks[n]);
            if ( confirm(`Удалить запись от ${$moment(item.dt).format('DD.MM.YYYY')}?`) ){
                this.ticks.splice(n, 1);
            }
        },
        save(){
            this.show = false;
            const res = [];
            this.ticks?.forEach( t => {
                t.selected = false;
                res.push(ref(t));
            });
            this.$emit('ticks', res);
        }
    }
}
</script>
<style lang="scss">
    .cb-trip-tickets {
        & .v-card {
            &-actions {
                justify-content: flex-end;
            }
        }
        & .v-data-table{
            font-size: 0.9rem;
            &-footer{
                display: none !important;
            }
            & td{
                font-size: 0.9rem;
                vertical-align: text-bottom;
                &:last-child{
                    white-space: nowrap;
                }
                &.note{
                    width: 10rem;
                }
            }
            & td.numof{
                text-align: right !important;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                & .v-input{
                    max-width: 5rem;
                    & input{
                        text-align: right !important;
                    }
                }
            }
        }
        & .v-btn{
            &--absolute{
                right: 1rem;
                bottom: 3rem;
                z-index: 9;
            }
        }
    }
</style>