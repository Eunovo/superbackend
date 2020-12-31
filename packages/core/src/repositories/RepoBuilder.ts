import { Model } from "../Model";
import { Repository } from "./Repository";

export type RepoBuilder = (model: Model) => Repository;
