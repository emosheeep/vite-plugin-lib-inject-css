import type { App } from 'vue';
import { Demo1 } from './demo1';
import { Demo2 } from './demo2';

export { Demo1, Demo2 };

export default (app: App) => {
  app.component(Demo1.name!, Demo1);
  app.component(Demo2.name!, Demo2);
};
