import { lazy } from 'react'

// The rig and the poses stay out of the start bundle: screens that open first ("Heute") load the
// figure afterwards. It is the same chunk the catalog uses, which is preloaded once the app idles.
export const LazyExerciseAnimation = lazy(() => import('./ExerciseAnimation').then((module) => ({ default: module.ExerciseAnimation })))
export const LazyWaveFigure = lazy(() => import('./WaveFigure').then((module) => ({ default: module.WaveFigure })))
