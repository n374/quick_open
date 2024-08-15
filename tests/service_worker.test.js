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
        var text = '';
        handleInputChanged(text, suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            {content: 'st', description: 'pattern: st - stackoverflow by tag'},
            {content: 'g', description: 'pattern: g - google'},
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: 'pattern: st | tag: python'
        });

        handleInputEntered(text);
        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'https://stackoverflow.com/questions/tagged/python'
        });
    });

    test('handleInputChanged suggests matching patterns based on input', () => {
        const suggestMock = jest.fn();
        {
            var text = 'g';
            handleInputChanged(text, suggestMock);

            expect(suggestMock).toHaveBeenCalledWith([
                {content: 'g', description: 'pattern: <match>g</match> - google'},
                {content: 'st', description: 'pattern: st - stackoverflow by tag'}
            ]);
            expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
                description: 'pattern: g | location: google.com.hk,zh-cn | ie: UTF-8 | search: '
            });

            handleInputEntered(text);
            expect(chrome.tabs.create).toHaveBeenCalledWith({
                url: 'https://google.com.hk/search?ie=UTF-8&q=&hl=zh-cn'
            });
        }

        {
            var text = 's';
            handleInputChanged(text, suggestMock);

            expect(suggestMock).toHaveBeenCalledWith([
                {
                    content: 'st',
                    description: 'pattern: <match>s</match>t - stackoverflow by tag'
                },
                {content: 'g', description: 'pattern: g - google'}
            ]);
            expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
                description: 'pattern: st | tag: python'
            });
            handleInputEntered(text);
            expect(chrome.tabs.create).toHaveBeenCalledWith({
                url: 'https://google.com.hk/search?ie=UTF-8&q=&hl=zh-cn'
            });
        }
    });

    test('handleInputChanged suggests matching parameters for select type', () => {
        const suggestMock = jest.fn();
        var text = 'g hk';
        handleInputChanged(text, suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            {
                content: 'g hk',
                description: 'location: <match>h</match><match>k</match> - google.com.hk, zh-cn'
            },
            {content: 'g jp', description: 'location: jp - google.com.jp, jp'},
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: 'pattern: g | location: google.com.hk,zh-cn | ie: UTF-8 | search: '
        });

        handleInputEntered(text);
        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'https://google.com.hk/search?ie=UTF-8&q=&hl=zh-cn'
        });
    });

    test('handleInputChanged provides input suggestion for input type', () => {
        const suggestMock = jest.fn();
        var text = 'g h UTF-8 ';
        handleInputChanged(text, suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            {content: text, description: `search: <match>please input any string</match> - input`}
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: 'pattern: g | location: google.com.hk,zh-cn | ie: UTF-8 | search: '
        });

        handleInputEntered(text);
        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'https://google.com.hk/search?ie=UTF-8&q=&hl=zh-cn'
        });
    });

    test('provides input suggestion for input type', () => {
        const suggestMock = jest.fn();
        var text = 'g h UTF-8 hello';
        handleInputChanged(text, suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            {content: text, description: "search: <match>hello</match> - input"}
        ]);
        expect(chrome.omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
            description: 'pattern: g | location: google.com.hk,zh-cn | ie: UTF-8 | search: hello'
        });

        handleInputEntered(text);
        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'https://google.com.hk/search?ie=UTF-8&q=hello&hl=zh-cn'
        });
    });
});
