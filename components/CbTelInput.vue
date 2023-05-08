<template>
    <v-text-field v-bind="{ ...$attrs, ...$props}"
                  variant="underlined"
                  v-on:update:modelValue="onchange"></v-text-field>
</template>
<script>
import Inputmask from "inputmask";
import { empty } from "~/utils";
import { defineComponent } from 'vue';
import { VTextField } from "vuetify/components/VTextField";

const _PH_MASK = "+7(999)999-99-99";

export default defineComponent({
    name: 'CbTelInput',    
    extends: VTextField,
    prpos: {
        value: {
            required: false,
            default: null
        }
    },
    mounted(){
        this.$nextTick(()=>{
            Inputmask({mask: _PH_MASK}).mask($(this.$el).find("input").get(0));
        });
    },
    methods: {
        onchange(e){
            console.log('onchange', e);
            this.$emit('ontel', e);
        }
    }
});
</script>    
