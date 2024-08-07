import {jest} from '@jest/globals';
import { chrome } from 'jest-chrome';
import { handleInputChanged, handleInputEntered } from '../src/service_worker/main';

// Mock chrome APIs
chrome.tabs.create =  jest.fn()
chrome.omnibox.setDefaultSuggestions =  jest.fn()
chrome.omnibox.onInputChanged.addListener = jest.fn()
chrome.omnibox.onInputEntered.addListener = jest.fn()

describe('Omnibox integration tests', () => {
    beforeEach(() => {
        chrome.omnibox.setDefaultSuggestion.mockClear();
        chrome.tabs.create.mockClear();
    });

    test('handleInputChanged suggests patterns when no input is provided', () => {
        const suggestMock = jest.fn();
        handleInputChanged('', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({ content: 'g' }),
            expect.objectContaining({ content: 'o' })
        ]);
    });

    test('handleInputChanged suggests matching patterns based on input', () => {
        const suggestMock = jest.fn();
        handleInputChanged('g', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({ content: 'g' }),
            expect.objectContaining({ content: 'o' })
        ]);
    });

    test('handleInputChanged suggests matching parameters for select type', () => {
        const suggestMock = jest.fn();
        handleInputChanged('g hk', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({ content: 'hk' }),
            expect.objectContaining({ content: 'jp' })
        ]);
    });

    test('handleInputChanged provides input suggestion for input type', () => {
        const suggestMock = jest.fn();
        handleInputChanged('g hk UTF-8 ', suggestMock);

        expect(suggestMock).toHaveBeenCalledWith([
            expect.objectContaining({ description: "Please input any string" })
        ]);
    });

    test('handleInputEntered creates a tab with the correct URL', () => {
        handleInputEntered('g hk UTF-8 OpenAI');

        expect(chrome.tabs.create).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'https://google.com.hk/search?ie=UTF-8&q=OpenAI&hl=zh-cn'
            })
        );

    });

    test('handleInputEntered uses default values when not all parameters are provided', () => {
        handleInputEntered('g hk');

        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'https://google.com.hk/search?ie=UTF-8&q=&hl=zh-cn'
        });
    });
});
