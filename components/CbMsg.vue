<template>
<v-snackbar v-model="hasSnackbar"
            class="cb-app-snackbar"
            location="bottom"
            dark
            :color="args.color"
            :timeout="args.timeout">
        <div v-html="args.text"></div>
        <div class="cb-app-snackbar__btn"
             v-if="args.click">
            <v-btn size="small"
                   :color="args.color"
                   v-on:click="args.click">
                {{ args.click_title || 'OK' }}
            </v-btn>
        </div>
        <v-btn size="x-small"
               class="cb-app-snackbar__close"
               dark 
               icon
               fab
               :color="args.color" 
               v-on:click="hasSnackbar=false">
            <v-icon small>mdi-close</v-icon>
        </v-btn>
</v-snackbar>
</template>
<script>
import { ref } from "vue";
import { empty } from '~/utils';

const _MSG_DEFS = {
    color: "primary",
    timeout: 6000,
    text: null,
    show: false,
    click: undefined,
    click_title: undefined
};


export const cbMsgArgs = ref({ ..._MSG_DEFS });

export default {
    name: 'CbMsg',
    computed: {
        args() {
            return cbMsgArgs.value;
        },
        hasSnackbar: {
            get(){ return !!this.args.show; },
            set(val){
                if (!val){
                    cbMsgArgs.value = { ..._MSG_DEFS };
                }
            }
        }
    }
};
</script>    
<style lang="scss">
    .cb-app-snackbar{
        & .v-snack__wrapper{
            max-width: calc(100% - 42px) !important;
            & .v-snack__content{
                font-size: 0.85rem;
                line-height: 1.125;
            }
        }
        &__btn {
            padding: 0.5rem 0;
            text-align: right;
        }
        & .v-btn.cb-app-snackbar__close{
            position: absolute;
            top: -14px;
            right: -12px;
            color: #f2f2f2;
            background: #f2f2f2;
            border: 1px solid #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.18);
        }
    }
</style>
