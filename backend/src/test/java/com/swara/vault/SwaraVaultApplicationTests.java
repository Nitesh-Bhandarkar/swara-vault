package com.swara.vault;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
	"storage.s3.bucket=test-bucket",
	"storage.s3.public-url=http://localhost/test-bucket",
	"cors.allowed-origins=http://localhost:5173"
})
class SwaraVaultApplicationTests {

	@Test
	void contextLoads() {
	}

}
