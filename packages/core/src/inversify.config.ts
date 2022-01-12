import { Container } from "inversify";
import "reflect-metadata";
import { Observable } from "./Observable";

const container = new Container();
container.bind(Observable).toConstantValue(new Observable());
export default container;