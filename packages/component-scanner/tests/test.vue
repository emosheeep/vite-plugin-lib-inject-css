<template lang="pug">
  AButton(@click="onClick")
    a-icon
  empty-box
</template>

<script setup lang="tsx">
import { message } from 'ant-design-vue';
import { MyEmptyBox as EmptyBox } from 'my-component-lib'
import { h, defineComponent } from 'vue';

const MyComponent = defineComponent({});
const MyButton = defineComponent({});

function onClick() {
  message.success({
    content: h('span', [
      h(MyButton),
      this.$createElement('div'),
      <MyComponent>
        <EmptyBox />
      </MyComponent>
    ]);
  })
}
</script>
