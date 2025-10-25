using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ProductService.Api.Commands.Dtos;

namespace ProductService.Api.Commands.Converters;

internal class QuestionDtoConverter : JsonConverter
{
    public override bool CanConvert(Type objectType)
    {
        return objectType.IsAssignableFrom(typeof(QuestionDto));
    }

    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
        var jsonObject = JObject.Load(reader);
        var target = Create(jsonObject);
        serializer.Populate(jsonObject.CreateReader(), target);
        return target;
    }

    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
        if (value is QuestionDto questionDto)
        {
            writer.WriteStartObject();
            writer.WritePropertyName("questionCode");
            serializer.Serialize(writer, questionDto.QuestionCode);
            writer.WritePropertyName("index");
            serializer.Serialize(writer, questionDto.Index);
            writer.WritePropertyName("text");
            serializer.Serialize(writer, questionDto.Text);
            writer.WritePropertyName("questionType");
            serializer.Serialize(writer, questionDto.QuestionType);
            
            if (questionDto is ChoiceQuestionDto choiceQuestion)
            {
                writer.WritePropertyName("choices");
                serializer.Serialize(writer, choiceQuestion.Choices);
            }

            writer.WriteEndObject();
        }
    }

    private static QuestionDto Create(JObject jsonObject)
    {
        var typeName = Enum.Parse<QuestionType>(jsonObject["questionType"].ToString());
        switch (typeName)
        {
            case QuestionType.Date:
                return new DateQuestionDto
                {
                    QuestionCode = jsonObject["questionCode"].ToString(),
                    Index = jsonObject["index"].Value<int>(),
                    Text = jsonObject["text"].ToString()
                };
            case QuestionType.Numeric:
                return new NumericQuestionDto
                {
                    QuestionCode = jsonObject["questionCode"].ToString(),
                    Index = jsonObject["index"].Value<int>(),
                    Text = jsonObject["text"].ToString()
                };
            case QuestionType.Choice:
                return new ChoiceQuestionDto
                {
                    QuestionCode = jsonObject["questionCode"].ToString(),
                    Index = jsonObject["index"].Value<int>(),
                    Text = jsonObject["text"].ToString(),
                    Choices = jsonObject["choices"].ToObject<IList<ChoiceDto>>()
                };
            default:
                throw new ApplicationException($"Unexpected question type {typeName}");
        }
    }
}