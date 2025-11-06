using System;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace PolicyService.Controllers;

[ApiController]
[ApiExplorerSettings(IgnoreApi = true)]
public class ErrorController : ControllerBase
{
    [Route("/error")]
    public IActionResult Error()
    {
        var exception = HttpContext.Features.Get<IExceptionHandlerFeature>()?.Error;
        if (exception is null)
        {
            return Problem();
        }

        return exception switch
        {
            // Domain/business validation
            ValidationException v => BadRequest(new { error = v.Message }),
            ApplicationException a => BadRequest(new { error = a.Message }),
            ArgumentException arg => BadRequest(new { error = arg.Message }),
            // Common programming nulls when payload is missing required data
            NullReferenceException nre => BadRequest(new { error = nre.Message }),
            _ => Problem()
        };
    }
}
