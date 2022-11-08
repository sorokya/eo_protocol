const {CstParser} = require('chevrotain');
const {allTokens} = require('./lexer');

const [
    DocComment,
    Comment,
    Integer,
    DataType,
    Break,
    Comma,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    LParen,
    RParen,
    ServerPacket,
    ClientPacket,
    Enum,
    Struct,
    Union,
    Function,
    Static,
    Const,
    Return,
    Multiply,
    Divide,
    Add,
    Subtract,
    Modulo,
    Equals,
    CharacterValue,
    Colon,
    SemiColon,
    Identifier,
    BlankLine,
    EverythingElse,
] = allTokens;

class ProtocolParser extends CstParser {
    constructor() {
        super(allTokens);

        const $ = this;

        $.RULE('protocol', () => {
            $.MANY(() => {
                $.OR([
                    {ALT: () => $.SUBRULE($.enum)},
                    {ALT: () => $.SUBRULE1($.struct)},
                    {ALT: () => $.SUBRULE2($.serverPacket)},
                    {ALT: () => $.SUBRULE3($.clientPacket)},
                ]);
            })
        });

        $.RULE('enum', () => {
            $.OPTION(() => {
                $.CONSUME(DocComment);
            });
            $.CONSUME(Enum);
            $.CONSUME(Identifier);
            $.CONSUME(Colon);
            $.CONSUME(DataType);
            $.CONSUME(LCurly);
            $.MANY(() => {
                $.SUBRULE($.enumVariant);
            });
            $.CONSUME(RCurly);
        });

        $.RULE('enumVariant', () => {
            $.CONSUME(Integer);
            $.CONSUME(Identifier);
        });

        $.RULE('struct', () => {
            $.OPTION(() => {
                $.CONSUME(DocComment);
            });
            $.CONSUME(Struct);
            $.CONSUME(Identifier);
            $.CONSUME(LCurly);
            $.MANY(() => {
                $.SUBRULE($.field);
            });
            $.CONSUME(RCurly);
        });

        $.RULE('clientPacket', () => {
            $.OPTION(() => {
                $.CONSUME(DocComment);
            });
            $.CONSUME(ClientPacket);
            $.CONSUME(LParen);
            $.CONSUME(Identifier);
            $.CONSUME(Comma);
            $.CONSUME1(Identifier);
            $.CONSUME(RParen);
            $.CONSUME(LCurly);
            $.MANY(() => {
                $.SUBRULE($.field);
            });
            $.CONSUME(RCurly);
        });

        $.RULE('serverPacket', () => {
            $.OPTION(() => {
                $.CONSUME(DocComment);
            });
            $.CONSUME(ServerPacket);
            $.CONSUME(LParen);
            $.CONSUME(Identifier);
            $.CONSUME(Comma);
            $.CONSUME1(Identifier);
            $.CONSUME(RParen);
            $.CONSUME(LCurly);
            $.MANY(() => {
                $.SUBRULE($.field);
            });
            $.CONSUME(RCurly);
        });

        $.RULE('field', () => {
            $.OR([
                {ALT: () => $.SUBRULE($.normalField)},
                {ALT: () => $.SUBRULE($.structField)},
                {ALT: () => $.SUBRULE($.breakField)},
                {ALT: () => $.SUBRULE($.literalField)},
                {ALT: () => $.SUBRULE($.union)},
                {ALT: () => $.SUBRULE($.function)},
            ]);
        })

        $.RULE('normalField', () => {
            $.OR([
                {ALT: () => $.CONSUME(DataType, {LABEL: 'FieldDataType'})},
                {ALT: () => $.CONSUME(Identifier, {LABEL: 'FieldDataType'})},
            ]);

            // Enum type
            $.OPTION(() => {
                $.CONSUME(Colon);
                $.CONSUME1(DataType, {LABEL: 'EnumDataType'});
            })

            // Fixed length
            $.OPTION1(() => {
                $.CONSUME(LParen);
                $.OPTION2(() => {
                    $.OR1([
                        {ALT: () => $.CONSUME(Integer, {LABEL: 'FixedLength'})},
                        {ALT: () => $.CONSUME2(Identifier, {LABEL: 'FixedLength'})},
                    ]);
                });
                $.CONSUME(RParen);
            })

            $.CONSUME1(Identifier, {LABEL: 'FieldName'});

            // Array
            $.OPTION3(() => {
                $.CONSUME(LSquare);

                // Optional length
                $.OPTION4(() => {
                    $.CONSUME1(Integer, {LABEL: 'ArrayLength'});
                });
                $.CONSUME(RSquare);
            });
        });

        $.RULE('structField', () => {
            $.CONSUME(Struct);

            // Struct name
            $.CONSUME(Identifier);

            // identifier
            $.CONSUME1(Identifier);

            // Array
            $.OPTION(() => {
                $.CONSUME(LSquare);

                // Optional length
                $.OPTION1(() => {
                    $.OR([
                        {ALT: () => $.CONSUME(Integer, {LABEL: 'ArrayLength'})},
                        {ALT: () => $.CONSUME2(Identifier, {LABEL: 'ArrayLength'})},
                    ])
                });

                $.CONSUME(RSquare);
            });
        });

        $.RULE('breakField', () => {
            $.CONSUME(Break);
        });

        $.RULE('literalField', () => {
            $.CONSUME(DataType);
            $.CONSUME(Equals);
            $.OR([
                {ALT: () => $.CONSUME(Integer)},
                {ALT: () => $.CONSUME(CharacterValue)},
            ]);
        });

        $.RULE('union', () => {
            $.CONSUME(Union)
            $.CONSUME(LParen);
            $.CONSUME(Identifier);
            $.CONSUME(RParen);
            $.CONSUME(LCurly);
            $.MANY(() => {
                $.SUBRULE($.unionCase);
            });
            $.CONSUME(RCurly);
        });

        $.RULE('unionCase', () => {
            $.CONSUME(Identifier);
            $.CONSUME(Colon);
            $.CONSUME1(Identifier);

            $.CONSUME(LCurly);
            $.MANY(() => {
                $.SUBRULE($.field);
            });
            $.CONSUME(RCurly);
        });

        $.RULE('function', () => {
            $.CONSUME(Function);

            // Optional "static"
            $.OPTION(() => {
                $.CONSUME(Static);
            });

            // return type
            $.OR([
                {ALT: () => $.CONSUME(DataType, {LABEL: 'ReturnType'})},
                {ALT: () => $.CONSUME(Identifier, {LABEL: 'ReturnType'})},
            ])

            // function name
            $.CONSUME1(Identifier, {LABEL: 'FunctionName'});

            $.CONSUME(LParen);


            // TODO: handle more than one parameter (comma separated)
            // Optional parameters
            $.OPTION1(() => {
                $.MANY(() => {
                    $.CONSUME2(Identifier, {LABEL: 'ParameterType'});
                    $.CONSUME3(Identifier, {LABEL: 'ParameterName'});
                });
            });

            $.CONSUME(RParen);

            // Optional "const"
            $.OPTION2(() => {
                $.CONSUME(Const);
            });

            $.CONSUME(LCurly);
            $.MANY1(() => {
                $.SUBRULE($.statement);
            });
            $.CONSUME(RCurly);
        });

        $.RULE('statement', () => {
            $.OR([
                {ALT: () => $.SUBRULE($.return)},
                {ALT: () => $.SUBRULE($.assignment)},
                {ALT: () => $.SUBRULE($.increment)},
            ]);
        });

        $.RULE('return', () => {
            $.CONSUME(Return);
            $.MANY(() => {
                $.SUBRULE($.expression);
            })
            $.CONSUME(SemiColon);
        });

        $.RULE('expression', () => {
            $.OR([
                {ALT: () => $.CONSUME(Integer)},
                {ALT: () => $.CONSUME(Add)},
                {ALT: () => $.CONSUME(Subtract)},
                {ALT: () => $.CONSUME(Multiply)},
                {ALT: () => $.CONSUME(Divide)},
                {ALT: () => $.CONSUME(Modulo)},
                {ALT: () => $.SUBRULE($.cast)},
                {ALT: () => $.CONSUME(LParen)},
                {ALT: () => $.CONSUME(RParen)},
                {ALT: () => $.CONSUME(LSquare)},
                {ALT: () => $.CONSUME(RSquare)},
                {ALT: () => $.CONSUME(DataType)},
                {ALT: () => $.CONSUME(Identifier)},
            ]);
        });

        $.RULE('cast', () => {
            $.CONSUME(Identifier);
            $.CONSUME(LParen);
            $.CONSUME1(Identifier);
            $.CONSUME(RParen);
        });

        $.RULE('assignment', () => {
            $.OPTION(() => {
                $.CONSUME(DataType);
            });
            $.CONSUME(Identifier);
            $.CONSUME(Equals);
            $.MANY(() => {
                $.SUBRULE($.expression);
            });
            $.CONSUME(SemiColon);
        });

        $.RULE('increment', () => {
            $.CONSUME(Add);
            $.CONSUME1(Add);
            $.CONSUME(Identifier);
            $.CONSUME(SemiColon);
        });

        this.performSelfAnalysis();
    }
}

const parser = new ProtocolParser();

module.exports = parser;
