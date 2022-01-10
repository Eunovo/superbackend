export type MapAll<T = any, Y = any> = {
    [P in keyof T]: Y
}
