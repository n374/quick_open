import { chrome  } from 'jest-chrome'
import { handleInputChanged, handleInputEntered } from '../src/main';

describe('Omnibox integration tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Handle omnibox input and submission', () => {
        const inputSequence = ['', 'g', 'g h', 'g hn', 'g hng', 'g hng 8', 'g hng 8 hello'];
        const expectedSuggestions = [
            [
                { content: 'g', description: 'google' },
                { content: 'o', description: 'open' }
            ],
            [
                { content: 'g', description: 'google' },
                { content: 'o', description: 'open' }
            ],
            [
                {
                    content: 'g hk',
                    description: 'location: hk - google.com.hk, zh-cn'
                },
                {
                    content: 'g hongkong',
                    description: 'location: hongkong - google.com.hk, zh-cn'
                },
                {
                    content: 'g jp',
                    description: 'location: jp - google.com.jp, jp'
                },
                {
                    content: 'g japan',
                    description: 'location: japan - google.com.jp, jp'
                }
            ],
            [
                {
                    content: 'g hk',
                    description: 'location: h<match>k</match> - google.com.hk, zh-cn'
                },
                {
                    content: 'g hongkong',
                    description: 'location: h<match>ongk</match>ong - google.com.hk, zh-cn'
                },
                {
                    content: 'g jp',
                    description: 'location: jp - google.com.jp, jp'
                },
                {
                    content: 'g japan',
                    description: 'location: japan - google.com.jp, jp'
                }
            ],
            [
                {
                    content: 'g hongkong',
                    description: 'location: h<match>ongk</match>ong - google.com.hk, zh-cn'
                },
                {
                    content: 'g hk',
                    description: 'location: h<match>k</match> - google.com.hk, zh-cn'
                },
                {
                    content: 'g jp',
                    description: 'location: jp - google.com.jp, jp'
                },
                {
                    content: 'g japan',
                    description: 'location: japan - google.com.jp, jp'
                }
            ],
            [
                {
                    content: 'g hk UTF-8',
                    description: 'ie: <match>UTF-8</match> - UTF-8'
                },
                {
                    content: 'g hk UTF-16',
                    description: 'ie: UTF-16 - UTF-16'
                }
            ],
            []
        ];

        const suggestMock = jest.fn();

        // 模拟每一步的输入并测试suggestions
        inputSequence.forEach((input, index) => {
            handleInputChanged(input, suggestMock);

            if (expectedSuggestions[index].length > 0) {
                expect(suggestMock).toHaveBeenCalledWith(expectedSuggestions[index]);
            }

            // Clear the mock before the next input
            suggestMock.mockClear();
        });

        // 最终输入提交
        const finalInput = 'g hng 8 hello';
        handleInputEntered(finalInput);

        // 预期的URL应该是香港的Google，并且使用UTF-8编码和搜索关键词为hello
        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'https://google.com.hk/search?ie=UTF-8&q=hello&hl=zh-cn'
        });
    });
});
