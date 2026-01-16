When I tried to import types {Request, Response, NextFunction} I got issues.
It turns out it should be imported as `import type {Request, Response, NextFunction} from 'express';`

To find a document by ID is used findById();

We can find object by id and delete it by single function (findByIdAndDelete). My mistake: first, I searched for blog then validate if blog exists then delete it.

