import { Model } from "../model/Model";
import { Repository } from "./Repository";

export type RepoBuilder = (model: Model) => Repository;
