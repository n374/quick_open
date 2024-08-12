import {jest} from '@jest/globals';
import {chrome} from 'jest-chrome';

global.in_jest = true

// Mock chrome APIs
chrome.tabs.create = jest.fn()
chrome.omnibox.setDefaultSuggestions = jest.fn()
chrome.omnibox.onInputChanged.addListener = jest.fn()
chrome.omnibox.onInputEntered.addListener = jest.fn()
// chrome.action.onClicked.addListener = jest.fn()
// chrome.storage.session.set = jest.fn()

import {handleInputChanged, handleInputEntered} from '../src/service_worker';

describe('Omnibox integration tests', () => {
    beforeEach(() => {
        chrome.omnibox.setDefaultSuggestion.mockClear();
        chrome.tabs.create.mockClear();
    });

    test('handleInputChanged suggests patterns when no input is provided', () => {
        const suggestMock = jest.fn();
        handleInputChanged('', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({content: 'st'}),
            expect.objectContaining({content: 'g'})
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: expect.stringContaining('pattern: st | tag: python')
        });
    });

    test('handleInputChanged suggests matching patterns based on input', () => {
        const suggestMock = jest.fn();
        handleInputChanged('g', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({content: 'g'}),
            expect.objectContaining({content: 'st'})
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: expect.stringContaining('pattern: g | location: google.com.hk,zh-cn | ie: UTF-8 | search: ')
        });

        handleInputChanged('s', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({content: 'st'}),
            expect.objectContaining({content: 'g'})
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: expect.stringContaining('pattern: st | tag: python')
        });
    });

    test('handleInputChanged suggests matching parameters for select type', () => {
        const suggestMock = jest.fn();
        handleInputChanged('g hk', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({content: 'hk'}),
            expect.objectContaining({content: 'jp'})
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: expect.stringContaining('pattern: g | location: google.com.hk,zh-cn | ie: UTF-8 | search: ')
        });
    });

    test('handleInputChanged provides input suggestion for input type', () => {
        const suggestMock = jest.fn();
        handleInputChanged('g hk UTF-8 ', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({description: "Please input any string"})
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: expect.stringContaining('pattern: g | location: google.com.hk,zh-cn | ie: UTF-8 | search: ')
        });
    });

});
