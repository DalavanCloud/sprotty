/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import 'reflect-metadata';
import 'mocha';
import { expect } from "chai";
import { SModelElement, SModelElementSchema, SModelRootSchema } from "../model/smodel";
import { EMPTY_ROOT, SModelFactory } from '../model/smodel-factory';
import { SGraphFactory } from "../../graph/sgraph-factory";
import { CommandExecutionContext } from "../commands/command";
import { ConsoleLogger } from "../../utils/logging";
import { AnimationFrameSyncer } from "../animations/animation-frame-syncer";
import { SetModelAction, SetModelCommand } from "./set-model";

function compare(expected: SModelElementSchema, actual: SModelElement) {
    for (const p in expected) {
        const expectedProp = (expected as any)[p];
        const actualProp = (actual as any)[p];
        if (p === 'children') {
            for (const i in expectedProp) {
                compare(expectedProp[i], actualProp[i]);
            }
        } else {
            expect(actualProp).to.deep.equal(expectedProp);
        }
    }
}

describe('SetModelCommand', () => {
    const graphFactory = new SGraphFactory();

    const emptyRoot = new SModelFactory().createRoot(EMPTY_ROOT);

    const context: CommandExecutionContext = {
        root: emptyRoot,
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: new AnimationFrameSyncer()
    };

    // setup the GModel
    const model1 = graphFactory.createRoot({
        id: 'model1',
        type: 'graph',
        children: []
    });

    const model2: SModelRootSchema = {
        id: 'model2',
        type: 'graph',
        children: []
    };

    // create the action
    const mySetModelAction = new SetModelAction(model2 /* the new model */);

    // create the command
    const cmd = new SetModelCommand(mySetModelAction);


    it('execute() returns the new model', () => {
        // execute command
        context.root = model1;  /* the old model */
        const newModel = cmd.execute(context);
        compare(model2, newModel);
        expect(model1.id).to.equal(cmd.oldRoot.id);
        expect(newModel.id).to.equal(cmd.newRoot.id);
    });

    it('undo() returns the previous model', () => {
        // test "undo": returns old model
        expect(model1.id).to.equal(cmd.undo(context).id);
    });

    it('redo() returns the new model', () => {
        // test "redo": returns new model
        const newModel = cmd.redo(context);
        compare(model2, newModel);
    });
});
