    import { SetMetadata } from '@nestjs/common';

    export const IS_PUBLIC_KEY = 'isPublic';
    export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);


// Example Usage
// @Controller('auth')
// export class AuthController {
//   @Public() // This route is public
//   @Get('login')
//   login() {
//   }