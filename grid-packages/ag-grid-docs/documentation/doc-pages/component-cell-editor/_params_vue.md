<framework-specific-section frameworks="vue">
<note>
|## Vue 3 - Class Based Components & Typed Components
|
|If you're using a Class Based Component (i.e. you're using `vue-property-decorator`/`vue-class-component`), or if you're using a vanilla Vue 3 component
|with `lang='ts'` then you'll need to specify the `params` object as a `prop`.
|
|For example:
|
</note>
</framework-specific-section>

<framework-specific-section frameworks="vue">
<snippet transform={false}>
|&lt;script lang="ts">
|    import {defineComponent} from "vue";
|
|    export default defineComponent({
|        name: "MyComponent",
|        props: ['params'],  // required for TypeScript ...
|    })
|&lt;/script>
</snippet>
</framework-specific-section>
