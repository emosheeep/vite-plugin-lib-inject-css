import { type App } from 'vue';
import { DemoComponent } from './demo-component';

export { DemoComponent };

export default (app: App) => {
  app.component(DemoComponent.name, DemoComponent);
};
