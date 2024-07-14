import client from '$lib/client';
import { FrontendUser } from '$lib/types';

function diff(beforeObject: any, afterObject: any){
	const before: {[id: string] : any} = {}
	const after: {[id: string] : any} = {}
	for (const key in afterObject) {
		if (beforeObject[key] != afterObject[key]) {
			before[key] = beforeObject[key]
			after[key] = afterObject[key]
		}
	}
	return [before, after]
}

const auditTables: {[id: string] : any} = {
	Completion: client.completion,
	Mission: client.mission,
	MissionPack: client.missionPack,
	User: client.user
}

const auditOperations: {[id: string] : any} = {
	async update(user: FrontendUser, modelObject: any, model: string, args: any, query: any) {
		const record = await modelObject.findFirst({where: args.where})

		const [before, after] = diff(record, args.data)

		await client.auditLog.create(
			{
				data: {
					userId: user.id,
					model: model,
					recordId: record.id.toString(),
					action: 'update',
					before: before,
					after: after
				}
			}
		)

		return query(args)
	},
	async delete(user: FrontendUser, modelObject: any, model: string, args: any, query: any) {
		const record = await modelObject.findFirst({where: args.where})

		await client.auditLog.create(
			{
				data: {
					userId: user.id,
					model: model,
					recordId: record.id.toString(),
					action: 'delete',
					before: record
				}
			}
		)

		return query(args)
	},
	async deleteMany(user: FrontendUser, modelObject: any, model: string, args: any, query: any) {
		const records = await modelObject.findMany({where: args.where})

		for (const record of records) {
			
			await client.auditLog.create(
				{
					data: {
						userId: user.id,
						model: model,
						recordId: record.id.toString(),
						action: 'delete',
						before: record
					}
				}
			)
		}

		return query(args)
	},
	async updateMany(user: FrontendUser, modelObject: any, model: string, args: any, query: any) {
		const records = await modelObject.findMany({where: args.where})

		for (const record of records) {
			
			const [before, after] = diff(record, args.data)

			await client.auditLog.create(
				{
					data: {
						userId: user.id,
						model: model,
						recordId: record.id.toString(),
						action: 'update',
						before: before,
						after: after
					}
				}
			)
		}

		return query(args)
	},
	async create(user: FrontendUser, modelObject: any, model: string, args: any, query: any) {
		const record = await query(args)

		await client.auditLog.create(
			{
				data: {
					userId: user.id,
					model: model,
					recordId: record.id.toString(),
					action: 'create',
					after: record
				}
			}
		)

		return record
	},
	async upsert(user: FrontendUser, modelObject: any, model: string, args: any, query: any) {
		const record = await modelObject.findFirst({where: args.where})
		
		if (record) {
			//update
			const [before, after] = diff(record, args.update)

			await client.auditLog.create(
				{
					data: {
						userId: user.id,
						model: model,
						recordId: record.id.toString(),
						action: 'update',
						before: before,
						after: after
					}
				}
			)

			
			return query(args)
		}
		else {
			//create

			const record = await query(args)

			await client.auditLog.create(
				{
					data: {
						userId: user.id,
						model: model,
						recordId: record.id.toString(),
						action: 'create',
						after: record
					}
				}
			)

			return record
		}
	}
}

function auditClient(user: FrontendUser | null) {
	return client.$extends(
		{
			name: 'Audit Log',
			query: {
				$allModels: {
					async $allOperations( { model, operation, args, query }) {
						if (!user || !model) return query(args);

						if (!auditTables[model] || !auditOperations[operation]) return query(args);

						return await auditOperations[operation](user, auditTables[model], model, args, query)
					}
				}
			},
			model: {
				auditLog: {
					async fromUser(userId: string) {
						return await client.auditLog.findMany(
							{
								where: {
									userId: userId
								}
							}
						)
					},
					async forBomb(bombId: number) {
						return await client.auditLog.findMany(
							{
								where: {
									model: 'bomb',
									recordId: bombId.toString()
								}
							}
						)
					},
					async forCompletion(completionId: number) {
						return await client.auditLog.findMany(
							{
								where: {
									model: 'completion',
									recordId: completionId.toString()
								}
							}
						)
					},
					async forMission(missionId: number) {
						return await client.auditLog.findMany(
							{
								where: {
									model: 'mission',
									recordId: missionId.toString()
								}
							}
						)
					},
					async forMissionPack(missionPackId: number) {
						return await client.auditLog.findMany(
							{
								where: {
									model: 'missionpack',
									recordId: missionPackId.toString()
								}
							}
						)
					}
				}
			}
		}
	)
}

export default auditClient