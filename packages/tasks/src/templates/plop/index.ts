import componentTsx from './component.tsx.js'
import componentVue from './component.vue.js'
import hookTs from './hook.ts.js'
import moduleTs from './module.ts.js'
import pageTsx from './page.tsx.js'
import screenTsx from './screen.tsx.js'
import utilTestTs from './util.test.ts.js'
import utilTs from './util.ts.js'

export const plopTemplates = {
	'component.vue.hbs': componentVue,
	'component.tsx.hbs': componentTsx,
	'util.ts.hbs': utilTs,
	'util.test.ts.hbs': utilTestTs,
	'module.ts.hbs': moduleTs,
	'screen.tsx.hbs': screenTsx,
	'page.tsx.hbs': pageTsx,
	'hook.ts.hbs': hookTs,
}

export type PlopTemplateKey = keyof typeof plopTemplates
