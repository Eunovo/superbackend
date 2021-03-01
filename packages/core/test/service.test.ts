import "jest";
import { Service } from "../src";


test("it should setup event listeners and take them down", () => {
    expect.assertions(2);
    const event = "Test";
    const evtData = "Test";
    const service = new TestService();

    const unuscribe = service.listen(event, (evt, data) => {
        expect(evt).toEqual(event);
        expect(data).toEqual(evtData);
    });

    service.doSomething(event, evtData);
    unuscribe();
    service.doSomething(event, evtData);
});

class TestService extends Service {

    doSomething(event: string, data: any) {
        this.fire(event, data);
    }

}
