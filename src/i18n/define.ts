/**
 * One section of the app's texts, German and English side by side. The German texts define the
 * shape, so a missing or extra English text is a type error. Texts with values are functions.
 */
export const define = <T extends object>(de: T, en: NoInfer<T>) => ({ de, en })
