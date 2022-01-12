export interface IRequest<T, U, V> {
    body?: T
    query?: U
    params?: V
    user?: any
}
