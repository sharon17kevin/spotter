import axios, { type AxiosRequestConfig } from "axios";

export interface FetchResponse<T> {
    count: number;
    next: string | null;
    results: T[];
}

const axiosInstance =  axios.create({
    baseURL: 'https://api.rawg.io/api',
    params: {
        key: '7af71124eb32438eac14bfac6d2c8fa7'
    }
})

export default class APIClient<T> {
    endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint
    }

    getAll = (config: AxiosRequestConfig) => {
        return axiosInstance
            .get<FetchResponse<T>>(this.endpoint, config)
            .then(res=> res.data)
    }

    post = (config: AxiosRequestConfig) => {
        return axiosInstance
        .post<T>(
            this.endpoint,
            config.data,
            config
        )
        .then(res => res.data);
    };


    get = (id: string|number) => {
        return axiosInstance
        .get<T>(this.endpoint + '/' + id)
        .then(res=>res.data)
    }
}